import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { senderId, senderEmail } = await request.json()
    console.log("Fetch emails request:", { senderId, senderEmail })

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("User check:", { user: user?.id, error: userError })

    if (userError || !user) {
      console.error("User authentication failed:", userError)
      return NextResponse.json({ error: "Unauthorized - No valid user session" }, { status: 401 })
    }

    // Get the user's Google access token from their session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("Session check:", {
      hasSession: !!session,
      hasProviderToken: !!session?.provider_token,
      provider: session?.provider_token ? "present" : "missing",
    })

    if (!session?.provider_token) {
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
      `https://gmail.googleapis.com/gmail/v1/users/${senderEmail}/messages?q=from:${senderEmail}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      console.error("Gmail API error:", response.status, response.statusText)
      return NextResponse.json({ error: "Failed to fetch emails from Gmail API" }, { status: 500 })
    }

    const data = await response.json()

    // Extract email IDs
    const emailIds = data.messages?.map((message: any) => message.id) || []

    // Fetch the email content for each email ID
    const emailContents = await Promise.all(
      emailIds.map(async (emailId: string) => {
        const emailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/${senderEmail}/messages/${emailId}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!emailResponse.ok) {
          console.error("Gmail API error for email ID:", emailId, emailResponse.status, emailResponse.statusText)
          return null // Or handle the error as needed
        }

        const emailData = await emailResponse.json()
        return emailData
      }),
    )

    // Filter out any failed email fetches (where emailContents[i] is null)
    const validEmailContents = emailContents.filter((content) => content !== null)

    return NextResponse.json({ emails: validEmailContents }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
