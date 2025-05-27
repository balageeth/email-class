"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const handleLogin = async (type: "signIn" | "signUp") => {
    try {
      setLoading(true)
      setMessage(null)

      if (type === "signIn") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
        } else {
          setMessage("Signed in successfully!")
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
        } else {
          setMessage("Signed up successfully! Check your email to verify.")
        }
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setLoading(true)
      setMessage(null)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const testDirectOAuthURL = async () => {
    try {
      console.log("Testing Direct OAuth URL Generation...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("Error generating OAuth URL:", error)
      } else {
        console.log("Generated OAuth URL:", data?.url)
      }
    } catch (error: any) {
      console.error("Error:", error)
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
        } else {
          console.log("❌ OAuth URL does NOT point to Supabase!")
        }
      }
    } catch (error: any) {
      console.error("❌ Debug error:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6">Login / Sign Up</h2>
        {message && <div className="text-red-500 mb-4">{message}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => handleLogin("signIn")}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => handleLogin("signUp")}
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </div>
        <div className="mt-4">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In with Google"}
          </button>
        </div>
        <div className="mt-4">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={testDirectOAuthURL}
          >
            Test Direct OAuth URL
          </button>
        </div>
        <div className="mt-4">
          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={debugSupabaseOAuth}
          >
            Debug Supabase OAuth
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
