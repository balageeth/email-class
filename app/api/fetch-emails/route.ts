import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { senderId, senderEmail } = await request.json()
    console.log("Fetch emails request:", { senderId, senderEmail })

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // First, get the session directly
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasProviderToken: !!session?.provider_token,
      sessionError,
      userId: session?.user?.id,
    })

    if (sessionError || !session || !session.user) {
      console.error("Session authentication failed:", sessionError)
      return NextResponse.json(
        {
          error: "Unauthorized - No valid user session",
          details: sessionError?.message || "No session found",
        },
        { status: 401 },
      )
    }

    const user = session.user

    if (!session.provider_token) {
      return NextResponse.json(
        {
          error: "No Gmail access token found. Please re-authenticate with Google.",
        },
        { status: 400 },
      )
    }

    const accessToken = session.provider_token

    // Use the Gmail API to fetch emails
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:${senderEmail}&maxResults=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gmail API error:", response.status, response.statusText, errorText)
      return NextResponse.json(
        {
          error: `Failed to fetch emails from Gmail API: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Gmail API response:", { messageCount: data.messages?.length || 0 })

    // Extract email IDs
    const emailIds = data.messages?.map((message: any) => message.id) || []

    if (emailIds.length === 0) {
      return NextResponse.json({
        success: true,
        emailsFetched: 0,
        emailsStored: 0,
        message: `No emails found from ${senderEmail}`,
      })
    }

    // Fetch the email content for each email ID (limit to first 10 for testing)
    const limitedEmailIds = emailIds.slice(0, 10)
    const emailContents = await Promise.all(
      limitedEmailIds.map(async (emailId: string) => {
        const emailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!emailResponse.ok) {
          console.error("Gmail API error for email ID:", emailId, emailResponse.status, emailResponse.statusText)
          return null
        }

        const emailData = await emailResponse.json()
        return emailData
      }),
    )

    // Filter out any failed email fetches
    const validEmailContents = emailContents.filter((content) => content !== null)

    // Extract email information and store in database
    const emailsToInsert = validEmailContents.map((message: any) => {
      const headers = message.payload.headers
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject"
      const from = headers.find((h: any) => h.name === "From")?.value || "Unknown Sender"
      const date = headers.find((h: any) => h.name === "Date")?.value || message.internalDate

      let body = ""
      // Extract body content
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, "base64").toString("utf-8")
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find(
          (part: any) => part.mimeType === "text/plain" || part.mimeType === "text/html",
        )
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8")
        }
      }

      return {
        sender_id: senderId,
        user_id: user.id,
        subject,
        body: body.substring(0, 10000), // Limit body length
        received_at: new Date(Number.parseInt(message.internalDate)).toISOString(),
        gmail_message_id: message.id,
      }
    })

    // Insert emails into database (ignore duplicates)
    const { data: insertedEmails, error: insertError } = await supabase
      .from("emails")
      .upsert(emailsToInsert, {
        onConflict: "gmail_message_id",
        ignoreDuplicates: true,
      })
      .select()

    if (insertError) {
      console.error("Error inserting emails:", insertError)
      return NextResponse.json({ error: "Failed to store emails" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      emailsFetched: validEmailContents.length,
      emailsStored: insertedEmails?.length || 0,
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
