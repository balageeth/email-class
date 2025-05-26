import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== FETCH EMAILS API ROUTE START ===")

  try {
    const { senderId, senderEmail } = await request.json()
    console.log("1. Request data:", { senderId, senderEmail })

    // Get cookies from the request
    const cookieStore = await cookies()
    console.log("2. Cookie store created")

    // Create Supabase client with proper cookie handling
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })
    console.log("3. Supabase client created")

    // Check for Authorization header as fallback
    const authHeader = request.headers.get("authorization")
    console.log("4. Auth header present:", !!authHeader)

    // Try to get user first (this is more reliable than session)
    console.log("5. Attempting to get user...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("6. User check:", {
      hasUser: !!user,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email,
    })

    // If no user from cookies, try with auth header
    let validUser = user
    if (!user && authHeader) {
      console.log("7. Trying to get user with auth header...")
      const {
        data: { user: headerUser },
        error: headerUserError,
      } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

      console.log("8. User from auth header:", {
        hasUser: !!headerUser,
        userError: headerUserError?.message,
        userId: headerUser?.id,
        userEmail: headerUser?.email,
      })

      if (headerUserError || !headerUser) {
        console.error("9. User authentication failed:", headerUserError?.message || "No user")
        return NextResponse.json(
          {
            error: "Authentication required. Please sign in again.",
            details: headerUserError?.message || "No valid user found",
          },
          { status: 401 },
        )
      }

      validUser = headerUser
    }

    if (!validUser) {
      console.error("10. No valid user found")
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in again.",
          details: "No valid user found",
        },
        { status: 401 },
      )
    }

    // Get the stored provider token from our custom table
    console.log("11. Fetching stored provider token...")
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", validUser.id)
      .eq("provider", "google")
      .single()

    console.log("12. Token data check:", {
      hasTokenData: !!tokenData,
      hasAccessToken: !!tokenData?.access_token,
      tokenError: tokenError?.message,
      expiresAt: tokenData?.expires_at,
    })

    if (tokenError || !tokenData?.access_token) {
      console.error("13. No stored provider token found")
      return NextResponse.json(
        {
          error: "No Gmail access token found. Please sign out and sign in again to re-authorize Gmail access.",
          details: "Provider token not stored or expired",
        },
        { status: 401 },
      )
    }

    // Check if token is expired
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at)
      const now = new Date()
      if (now >= expiresAt) {
        console.error("14. Stored token is expired")
        return NextResponse.json(
          {
            error: "Gmail access token has expired. Please sign out and sign in again to re-authorize Gmail access.",
            details: "Token expired",
          },
          { status: 401 },
        )
      }
    }

    console.log("15. Valid token found, processing email fetch")
    return await processEmailFetch(validUser, tokenData.access_token, senderId, senderEmail, supabase)
  } catch (error: any) {
    console.error("=== FETCH EMAILS API ROUTE ERROR ===")
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processEmailFetch(user: any, accessToken: string, senderId: string, senderEmail: string, supabase: any) {
  console.log("Processing email fetch for user:", user.id)

  // Test the Gmail API connection first
  console.log("Testing Gmail API connection...")
  const testResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!testResponse.ok) {
    const testError = await testResponse.text()
    console.error("Gmail API test failed:", testResponse.status, testError)
    return NextResponse.json(
      {
        error: `Gmail API authentication failed: ${testResponse.status}`,
        details: testError,
      },
      { status: 500 },
    )
  }

  console.log("Gmail API test successful")

  // Use the Gmail API to fetch emails
  console.log("Fetching emails from Gmail...")
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
    console.log("No emails found")
    return NextResponse.json({
      success: true,
      emailsFetched: 0,
      emailsStored: 0,
      message: `No emails found from ${senderEmail}`,
    })
  }

  // Fetch the email content for each email ID (limit to first 10 for testing)
  const limitedEmailIds = emailIds.slice(0, 10)
  console.log("Fetching email details for", limitedEmailIds.length, "emails")

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
        console.error("Email fetch error for ID:", emailId, emailResponse.status, emailResponse.statusText)
        return null
      }

      const emailData = await emailResponse.json()
      return emailData
    }),
  )

  // Filter out any failed email fetches
  const validEmailContents = emailContents.filter((content) => content !== null)
  console.log("Valid email contents:", validEmailContents.length)

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

  console.log("Inserting", emailsToInsert.length, "emails into database")

  // Insert emails into database (ignore duplicates)
  const { data: insertedEmails, error: insertError } = await supabase
    .from("emails")
    .upsert(emailsToInsert, {
      onConflict: "gmail_message_id",
      ignoreDuplicates: true,
    })
    .select()

  if (insertError) {
    console.error("Database insert error:", insertError)
    return NextResponse.json({ error: "Failed to store emails" }, { status: 500 })
  }

  console.log("Successfully inserted emails:", insertedEmails?.length || 0)
  console.log("=== FETCH EMAILS API ROUTE SUCCESS ===")

  return NextResponse.json({
    success: true,
    emailsFetched: validEmailContents.length,
    emailsStored: insertedEmails?.length || 0,
  })
}
