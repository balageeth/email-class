"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("Error logging in:", error.message)
      } else {
        console.log("OAuth initiation successful:", data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? "Loading..." : "Login with Google"}
      </button>
    </div>
  )
}

export default LoginScreen
