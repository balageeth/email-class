"use client"

import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"

// Supabase configuration values (replace with your actual values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface DebugInfo {
  method1Status?: number
  method1Data?: any
  method2AuthUrl?: string
  method3Status?: number
  method4Result?: any
  supabaseUrl?: string
  projectRef?: string
  error?: string
  stack?: string
}

function LoginScreen() {
  const [session, setSession] = useState(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const testSupabaseOAuthConfig = async () => {
    try {
      console.log("Testing Supabase OAuth with multiple methods...")

      // Method 1: Direct settings endpoint
      const response1 = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })

      console.log("Method 1 - Settings endpoint:")
      console.log("Response status:", response1.status)

      if (response1.ok) {
        const settings1 = await response1.json()
        console.log("Full settings:", settings1)
        console.log("External providers:", settings1.external)
      }

      // Method 2: Try the authorize endpoint to see what Supabase thinks
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin + "/auth/callback")}`
      console.log("Method 2 - Auth URL that would be generated:", authUrl)

      // Method 3: Check if we can get provider info differently
      const response3 = await fetch(
        `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin + "/auth/callback")}`,
        {
          method: "HEAD",
          headers: {
            apikey: supabaseAnonKey!,
          },
        },
      )

      console.log("Method 3 - Authorize endpoint test:")
      console.log("Status:", response3.status)
      console.log("Headers:", Object.fromEntries(response3.headers.entries()))

      // Method 4: Test with the Supabase client directly
      console.log("Method 4 - Testing with Supabase client...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // This prevents actual redirect
        },
      })

      console.log("Supabase client test:", { data, error })

      setDebugInfo({
        method1Status: response1.status,
        method1Data: response1.ok ? await response1.clone().json() : "Failed",
        method2AuthUrl: authUrl,
        method3Status: response3.status,
        method4Result: { data, error: error?.message },
        supabaseUrl,
        projectRef: supabaseUrl?.split("//")[1]?.split(".")[0],
      })
    } catch (error: any) {
      console.error("Error in enhanced OAuth config test:", error)
      setDebugInfo({ error: error.message, stack: error.stack })
    }
  }

  return (
    <div className="container" style={{ padding: "50px 0 100px 0" }}>
      {!session ? (
        <div className="supabase-auth">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google", "github"]}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
          <button onClick={testSupabaseOAuthConfig}>Test Supabase OAuth Config</button>
          {debugInfo && (
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : (
        <p>You are signed in!</p>
      )}
    </div>
  )
}

export default LoginScreen
