import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { GmailService } from "@/lib/gmail"

export async function POST(request: NextRequest) {
  try {
    const { senderId, senderEmail } = await request.json()

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's Google access token from their session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.provider_token) {
      return NextResponse.json(
        {
          error: "No Gmail access token found. Please re-authenticate with Google.",
        },
        { status: 400 },
      )
    }

    // Initialize Gmail service
    const gmailService = new GmailService(session.provider_token)

    // Fetch emails from the sender
    const messages = await gmailService.searchEmails(senderEmail, 20)

    // Process and store emails in database
    const emailsToInsert = messages.map((message) => {
      const { subject, from, date, body } = gmailService.extractEmailContent(message)

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
      emailsFetched: messages.length,
      emailsStored: insertedEmails?.length || 0,
    })
  } catch (error) {
    console.error("Error in fetch-emails API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch emails from Gmail",
      },
      { status: 500 },
    )
  }
}
