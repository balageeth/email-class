import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("3. Error exchanging code for session:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=${error.message}`)
    }

    console.log("4. Exchange result:", data)
    console.log("5. Session object:", data.session)
    console.log("6. User object:", data.session?.user)
    console.log("7. Access token:", data.session?.access_token ? "PRESENT" : "MISSING")
    console.log("8. Refresh token:", data.session?.refresh_token ? "PRESENT" : "MISSING")
    console.log("9. Provider token:", data.session?.provider_token ? "PRESENT" : "MISSING")

    console.log("5.1. Full session data:", JSON.stringify(data.session, null, 2))
    console.log("5.2. Session properties:", data.session ? Object.keys(data.session) : "No session")
    console.log("5.3. Provider token type:", typeof data.session?.provider_token)
    console.log("5.4. Provider token value:", data.session?.provider_token ? "PRESENT" : "MISSING")

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/auth/account`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=No code provided`)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const requestUrl = new URL(req.url)
  const formData = await req.formData()
  const email = String(formData.get("email"))
  const password = String(formData.get("password"))
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("10. Sign-in error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate`, {
      status: 301,
    })
  }

  if (!data.session?.provider_token) {
    console.error("13. No provider token in session data")
    console.log("14. Full session object:", JSON.stringify(data.session, null, 2))
    console.log("15. Available session properties:", data.session ? Object.keys(data.session) : "No session")

    // Check if there are any other token-related fields
    if (data.session) {
      const tokenFields = Object.keys(data.session).filter(
        (key) => key.toLowerCase().includes("token") || key.toLowerCase().includes("access"),
      )
      console.log("16. Token-related fields found:", tokenFields)
      tokenFields.forEach((field) => {
        console.log(`17. ${field}:`, data.session[field] ? "PRESENT" : "MISSING")
      })
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/account`, {
    status: 301,
  })
}
