"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface LoginScreenProps {
  error?: string | null
}

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

export default function LoginScreen({ error }: LoginScreenProps = {}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [signUp, setSignUp] = useState(false)
  const [authError, setAuthError] = useState<string | null>(error || null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
      } else {
        alert("Sign-up successful! Please check your email to verify your account.")
        setSignUp(false)
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
      console.log("🔍 OAuth Flow Debug:")
      console.log("Redirect URL:", `${window.location.origin}/auth/callback`)
      console.log("Supabase URL:", supabaseUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setAuthError(error.message)
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

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

      let settings1 = null
      if (response1.ok) {
        settings1 = await response1.json()
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
        method1Data: settings1 || "Failed to parse",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{signUp ? "Sign Up" : "Sign In"}</CardTitle>
            <CardDescription>
              {signUp ? "Create an account to continue" : "Enter your email and password to sign in"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <div className="rounded-md bg-red-100 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{authError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={signUp ? handleSignUp : handleSignIn} disabled={loading}>
              {loading ? "Loading..." : signUp ? "Sign Up" : "Sign In"}
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={() => setSignUp(!signUp)} disabled={loading}>
                {signUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleOAuthSignIn} disabled={loading}>
              Google OAuth (Enhanced Debug)
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enhanced OAuth Debug Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={testSupabaseOAuthConfig} disabled={loading}>
              🔍 Test Supabase OAuth Config (Enhanced)
            </Button>

            <div className="text-xs space-y-1">
              <p>
                <strong>Supabase URL:</strong> {supabaseUrl}
              </p>
              <p>
                <strong>Anon Key:</strong> {supabaseAnonKey?.substring(0, 20)}...
              </p>
              <p>
                <strong>Project Ref:</strong> {supabaseUrl?.split("//")[1]?.split(".")[0]}
              </p>
            </div>

            {debugInfo && Object.keys(debugInfo).length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Enhanced OAuth Debug Results:</h4>
                <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
