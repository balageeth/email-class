"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const LoginScreen = () => {
  const router = useRouter()
  const supabase = createClientComponentClient()

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
  }, [router, supabase])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
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
        console.log("6. Redirect URI in OAuth URL:", redirectUri)

        if (redirectUri && redirectUri.includes("supabase.co")) {
          console.log("✅ OAuth URL correctly points to Supabase")
          console.log("7. 🎯 CONCLUSION: OAuth URL is correct!")
          console.log("8. 🔧 NEXT STEP: Check your Google Cloud Console redirect URIs")
          console.log("9. 📋 Your Google OAuth app should have ONLY this redirect URI:")
          console.log(`   ${redirectUri}`)
        } else {
          console.log("❌ OAuth URL does NOT point to Supabase!")
          console.log("7. 🚨 PROBLEM: OAuth URL is misconfigured")
          console.log("8. 🔧 Expected redirect URI should contain 'supabase.co'")
          console.log(`9. 📋 But got: ${redirectUri}`)
        }
      } else {
        console.log("❌ No OAuth URL generated!")
        console.log("7. 🚨 PROBLEM: Supabase failed to generate OAuth URL")
        console.log("8. 🔧 Check your Supabase Google provider configuration")
      }
    } catch (error: any) {
      console.error("❌ Debug error:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={handleSignIn}
      >
        Sign in with Google
      </button>
      <button
        className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={debugSupabaseOAuth}
      >
        Debug OAuth
      </button>
    </div>
  )
}

export default LoginScreen
