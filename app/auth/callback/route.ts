export async function GET(request: NextRequest) {
  console.log("🚀 CALLBACK ROUTE HIT!")

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const state = requestUrl.searchParams.get("state")

  console.log("=== AUTH CALLBACK START ===")
  console.log("1. Code present:", !!code)
  console.log("2. Error present:", !!error)
  console.log("3. State present:", !!state)
  console.log("4. Full URL:", requestUrl.toString())
  console.log("5. All search params:", Object.fromEntries(requestUrl.searchParams))
  console.log("6. Request headers:", Object.fromEntries(request.headers.entries()))

  // Handle OAuth errors
  if (error) {
    console.error("7. OAuth error:", error)
    const errorDescription = requestUrl.searchParams.get("error_description")
    console.error("8. Error description:", errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
  }

  if (!code) {
    console.error("9. ❌ No authorization code received!")
    console.log("10. This might indicate:")
    console.log("    - OAuth flow was cancelled by user")
    console.log("    - Supabase OAuth configuration issue")
    console.log("    - Redirect URL mismatch")
    console.log("    - Google OAuth app configuration issue")

    // Redirect back to login with error info
    return NextResponse.redirect(`${requestUrl.origin}/?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    console.log("11. Exchanging code for session...")
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    console.log("12. Exchange result:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      hasProviderToken: !!data.session?.provider_token,
      hasProviderRefreshToken: !!data.session?.provider_refresh_token,
      provider: data.session?.provider,
      exchangeError: exchangeError?.message,
    })

    if (exchangeError) {
      console.error("13. Session exchange error:", exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
    }

    console.log("14. Full session data:", JSON.stringify(data.session, null, 2))
    console.log("15. Session properties:", data.session ? Object.keys(data.session) : "No session")

    // Check for provider token
    if (data.session?.provider_token) {
      console.log("16. ✅ Provider token found! Length:", data.session.provider_token.length)

      // Store the provider token
      const tokenData = {
        user_id: data.session.user.id,
        provider: "google",
        access_token: data.session.provider_token,
        refresh_token: data.session.provider_refresh_token || null,
        expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      console.log("17. Storing token in database...")
      const { error: tokenError } = await supabase.from("user_tokens").upsert(tokenData, {
        onConflict: "user_id,provider",
      })

      if (tokenError) {
        console.error("18. ❌ Token storage error:", tokenError)
      } else {
        console.log("19. ✅ Token stored successfully!")
      }
    } else {
      console.error("20. ❌ No provider token in session!")
      console.log("21. Available session keys:", data.session ? Object.keys(data.session) : [])

      // Check for any token-like fields
      if (data.session) {
        const allKeys = Object.keys(data.session)
        const tokenKeys = allKeys.filter(
          (key) =>
            key.toLowerCase().includes("token") ||
            key.toLowerCase().includes("access") ||
            key.toLowerCase().includes("oauth"),
        )
        console.log("22. Token-related keys found:", tokenKeys)
      }
    }

    console.log("23. Redirecting to dashboard...")
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error) {
    console.error("24. ❌ Unexpected error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
  }
}
