import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("🚀 CALLBACK ROUTE HIT!")

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  console.log("=== AUTH CALLBACK START ===")
  console.log("1. Code present:", !!code)
  console.log("2. Error present:", !!error)
  console.log("3. Full URL:", requestUrl.toString())
  console.log("4. Search params:", Object.fromEntries(requestUrl.searchParams))

  // Handle OAuth errors
  if (error) {
    console.error("5. OAuth error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log("6. Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log("7. Exchange result:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        hasProviderToken: !!data.session?.provider_token,
        hasProviderRefreshToken: !!data.session?.provider_refresh_token,
        provider: data.session?.provider,
        exchangeError: exchangeError?.message,
      })

      if (exchangeError) {
        console.error("8. Session exchange error:", exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
      }

      console.log("9. Full session data:", JSON.stringify(data.session, null, 2))
      console.log("10. Session properties:", data.session ? Object.keys(data.session) : "No session")

      // Check for provider token
      if (data.session?.provider_token) {
        console.log("11. ✅ Provider token found! Length:", data.session.provider_token.length)

        // Store the provider token
        const tokenData = {
          user_id: data.session.user.id,
          provider: "google",
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token || null,
          expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }

        console.log("12. Storing token in database...")
        const { error: tokenError } = await supabase.from("user_tokens").upsert(tokenData, {
          onConflict: "user_id,provider",
        })

        if (tokenError) {
          console.error("13. ❌ Token storage error:", tokenError)
        } else {
          console.log("14. ✅ Token stored successfully!")
        }
      } else {
        console.error("15. ❌ No provider token in session!")
        console.log("16. Available session keys:", data.session ? Object.keys(data.session) : [])

        // Check for any token-like fields
        if (data.session) {
          const allKeys = Object.keys(data.session)
          const tokenKeys = allKeys.filter(
            (key) =>
              key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("access") ||
              key.toLowerCase().includes("oauth"),
          )
          console.log("17. Token-related keys found:", tokenKeys)
        }
      }

      console.log("18. Redirecting to dashboard...")
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error("19. ❌ Unexpected error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
    }
  }

  console.log("20. No code parameter, redirecting to login")
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
