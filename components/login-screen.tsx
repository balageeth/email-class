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

export default function LoginScreen({ error }: LoginScreenProps = {}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [signUp, setSignUp] = useState(false)
  const [authError, setAuthError] = useState<string | null>(error || null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

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
      console.log("Testing Supabase OAuth with detailed debugging...")

      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const settings = await response.json()
      console.log("Full Supabase Auth Settings:", settings)

      const googleProvider = settings.external?.google
      console.log("Google provider object:", googleProvider)

      setDebugInfo({
        responseStatus: response.status,
        googleEnabled: googleProvider?.enabled || googleProvider === true,
        googleClientId: googleProvider?.client_id || "Missing",
        googleRedirectUri: googleProvider?.redirect_uri || "Missing",
        fullGoogleConfig: googleProvider,
      })
    } catch (error: any) {
      console.error("Error testing Supabase OAuth config:", error)
      setDebugInfo({ error: error.message })
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
              Google OAuth (Enhanced)
            </Button>
          </CardContent>
        </Card>

        {/* Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">OAuth Debug Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={testSupabaseOAuthConfig} disabled={loading}>
              🔍 Test Supabase OAuth Config
            </Button>

            <div className="text-xs space-y-1">
              <p>
                <strong>Supabase URL:</strong> {supabaseUrl}
              </p>
              <p>
                <strong>Anon Key:</strong> {supabaseAnonKey?.substring(0, 20)}...
              </p>
            </div>

            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">OAuth Configuration:</h4>
                <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
