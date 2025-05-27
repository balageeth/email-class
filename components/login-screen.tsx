"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const LoginScreen = ({ error }: { error?: string | null }) => {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.push("/dashboard")
      }
    }

    checkSession()

    // Check for URL errors
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get("error")
    if (errorParam) {
      setDebugInfo(`URL Error: ${errorParam}`)
    }
  }, [router])

  const handleSignIn = async () => {
    console.log("🚀 Starting OAuth flow...")

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly",
        },
      })

      console.log("OAuth response:", { data, error })

      if (error) {
        console.error("OAuth error:", error)
        setDebugInfo(`OAuth Error: ${error.message}`)
      }
    } catch (err: any) {
      console.error("Sign in error:", err)
      setDebugInfo(`Sign in Error: ${err.message}`)
    }
  }

  const debugSupabaseOAuth = async () => {
    try {
      console.log("🔍 Debugging Supabase OAuth Configuration...")
      console.log("1. Supabase URL:", supabaseUrl)
      console.log("2. Expected callback URL:", `${supabaseUrl}/auth/v1/callback`)

      // Test the Supabase OAuth endpoint directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly",
          skipBrowserRedirect: true, // This prevents the redirect!
        },
      })

      console.log("3. Supabase OAuth response:", { data, error })

      if (data?.url) {
        console.log("4. Generated OAuth URL:", data.url)

        // Parse the URL to check where it's redirecting
        const oauthUrl = new URL(data.url)
        console.log("5. OAuth URL breakdown:")
        console.log("   - Host:", oauthUrl.host)
        console.log("   - Pathname:", oauthUrl.pathname)
        console.log("   - Search params:", Object.fromEntries(oauthUrl.searchParams))

        // Check the redirect_uri parameter specifically
        const redirectUri = oauthUrl.searchParams.get("redirect_uri")
        const redirectTo = oauthUrl.searchParams.get("redirect_to")
        console.log("6. Redirect URI in OAuth URL:", redirectUri)
        console.log("7. Redirect To in OAuth URL:", redirectTo)

        // Now let's follow the OAuth URL to see what Google gets
        console.log("8. 🔍 Let's see what this URL actually redirects to...")

        // Make a fetch request to see where it redirects (this will show us the Google OAuth URL)
        try {
          const response = await fetch(data.url, {
            method: "GET",
            redirect: "manual", // Don't follow redirects automatically
          })

          const location = response.headers.get("location")
          console.log("9. Supabase redirects to:", location)

          if (location) {
            const googleUrl = new URL(location)
            console.log("10. Google OAuth URL breakdown:")
            console.log("    - Host:", googleUrl.host)
            console.log("    - Search params:", Object.fromEntries(googleUrl.searchParams))

            const googleRedirectUri = googleUrl.searchParams.get("redirect_uri")
            console.log("11. 🎯 ACTUAL redirect_uri sent to Google:", googleRedirectUri)

            setDebugInfo(`
🔍 Debug Results:
- Supabase URL: ${supabaseUrl}
- Generated OAuth URL: ${data.url}
- Redirect To: ${redirectTo}
- Google OAuth URL: ${location}
- 🎯 ACTUAL redirect_uri sent to Google: ${googleRedirectUri}

🔧 SOLUTION:
Your Google OAuth app needs this EXACT redirect URI:
${googleRedirectUri}

📋 Steps to fix:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add this redirect URI: ${googleRedirectUri}
5. Save and try signing in again
            `)
          } else {
            setDebugInfo("❌ Could not determine Google OAuth URL")
          }
        } catch (fetchError) {
          console.log("9. Could not fetch redirect location:", fetchError)
          setDebugInfo(`
🔍 Debug Results:
- Supabase URL: ${supabaseUrl}
- Generated OAuth URL: ${data.url}
- Redirect To: ${redirectTo}

🔧 LIKELY SOLUTION:
Your Google OAuth app needs this redirect URI:
${supabaseUrl}/auth/v1/callback

📋 Steps to fix:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials  
3. Edit your OAuth 2.0 Client ID
4. Add this redirect URI: ${supabaseUrl}/auth/v1/callback
5. Save and try signing in again
          `)
        }
      } else {
        console.log("❌ No OAuth URL generated!")
        console.log("7. 🚨 PROBLEM: Supabase failed to generate OAuth URL")
        console.log("8. 🔧 Check your Supabase Google provider configuration")
        setDebugInfo("❌ No OAuth URL generated!")
      }
    } catch (error: any) {
      console.error("❌ Debug error:", error)
      setDebugInfo(`Debug Error: ${error.message}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">MailMinder Login</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugInfo && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded max-w-4xl">
          <strong>Debug Info:</strong>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      <div className="space-y-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSignIn}
        >
          Sign in with Google
        </button>

        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={debugSupabaseOAuth}
        >
          Debug OAuth Configuration
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-600 max-w-md text-center">
        <p>
          <strong>Troubleshooting Steps:</strong>
        </p>
        <ol className="text-left mt-2 space-y-1">
          <li>1. Click "Debug OAuth Configuration" first</li>
          <li>2. Check the debug info above for the exact redirect URI</li>
          <li>3. Add that redirect URI to your Google OAuth app</li>
          <li>4. Then try "Sign in with Google"</li>
        </ol>
      </div>
    </div>
  )
}

export default LoginScreen
