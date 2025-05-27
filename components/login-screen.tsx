"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSignUp = async (type: "signup" | "signin") => {
    setLoading(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth[type]({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
      } else {
        console.log("Success!", data)
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async () => {
    setLoading(true)
    setAuthError(null)

    try {
      console.log("🔍 Starting OAuth Flow:")
      console.log("1. Redirect URL:", `${window.location.origin}/auth/callback`)
      console.log("2. Supabase URL:", supabaseUrl)

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

      console.log("3. OAuth response:", { data, error })

      if (error) {
        console.error("4. ❌ OAuth error:", error)
        setAuthError(`OAuth Error: ${error.message}`)
        setLoading(false)
        return
      }

      if (data?.url) {
        console.log("5. ✅ OAuth URL generated:", data.url)
        console.log("6. 🚀 Redirecting to Google...")

        // Force redirect immediately
        window.location.href = data.url
        return
      } else {
        console.error("7. ❌ No OAuth URL generated")
        setAuthError("Failed to generate OAuth URL")
        setLoading(false)
      }
    } catch (err: any) {
      console.error("8. ❌ Unexpected error:", err)
      setAuthError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  const testDirectOAuthURL = async () => {
    try {
      console.log("🔗 Testing direct OAuth URL...")

      const redirectTo = encodeURIComponent(`${window.location.origin}/auth/callback`)
      const directUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&access_type=offline&prompt=consent`

      console.log("Direct OAuth URL:", directUrl)
      console.log("🚀 Redirecting directly...")

      // Force immediate redirect
      window.location.href = directUrl
    } catch (error: any) {
      console.error("❌ Direct URL error:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl mb-4">Login</h2>

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-3" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

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
            onClick={() => handleSignUp("signin")}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => handleSignUp("signup")}
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
            Forgot Password?
          </a>
        </div>

        <div className="mt-4">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleOAuthSignIn}
            disabled={loading}
          >
            Sign In with Google
          </button>
        </div>

        <div className="mt-4">
          <button
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={testDirectOAuthURL}
          >
            Test Direct OAuth URL
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
