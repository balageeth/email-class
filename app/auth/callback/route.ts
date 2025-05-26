import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Session exchange error:", exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
      }

      // Success - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error("Unexpected error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
