import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  console.log("=== AUTH CALLBACK START ===")
  console.log("1. Code present:", !!code)
  console.log("2. Error present:", !!error)

  // Handle OAuth errors
  if (error) {
    console.error("3. OAuth error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log("4. Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log("5. Exchange result:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        hasProviderToken: !!data.session?.provider_token,
        hasProviderRefreshToken: !!data.session?.provider_refresh_token,
        provider: data.session?.provider,
        exchangeError: exchangeError?.message,
      })

      if (exchangeError) {
        console.error("6. Session exchange error:", exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
      }

      // Store the provider token in our custom table for reliable access
      if (data.session?.provider_token && data.session?.user) {
        console.log("7. Storing provider token in database...")
        console.log("8. Token details:", {
          tokenLength: data.session.provider_token.length,
          refreshTokenLength: data.session.provider_refresh_token?.length || 0,
          expiresAt: data.session.expires_at,
          userId: data.session.user.id,
        })

        const tokenData = {
          user_id: data.session.user.id,
          provider: "google",
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token || null,
          expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }

        console.log("9. Inserting token data:", {
          user_id: tokenData.user_id,
          provider: tokenData.provider,
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expires_at: tokenData.expires_at,
        })

        const { data: insertResult, error: tokenError } = await supabase.from("user_tokens").upsert(tokenData, {
          onConflict: "user_id,provider",
        })

        console.log("10. Token storage result:", {
          success: !tokenError,
          error: tokenError?.message,
          insertResult,
        })

        if (tokenError) {
          console.error("11. Error storing provider token:", tokenError)
          // Don't fail the auth flow, but log the error
        } else {
          console.log("12. Provider token stored successfully")
        }
      } else {
        console.error("13. No provider token in session data")
        console.log("14. Session data structure:", {
          hasSession: !!data.session,
          sessionKeys: data.session ? Object.keys(data.session) : [],
          providerToken: data.session?.provider_token ? "present" : "missing",
        })
      }

      console.log("15. Redirecting to dashboard")
      // Success - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error("16. Unexpected error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
    }
  }

  // No code parameter - redirect to login
  console.log("17. No code parameter, redirecting to login")
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
