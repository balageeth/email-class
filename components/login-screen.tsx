"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface LoginScreenProps {
  error?: string | null
}

export default function LoginScreen({ error }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Get Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      console.log("🔐 Starting Google OAuth...")

      // Log the current URL and expected redirect
      const currentOrigin = window.location.origin
      const redirectUrl = `${currentOrigin}/auth/callback`
      console.log("Current origin:", currentOrigin)
      console.log("Redirect URL:", redirectUrl)
      console.log("Supabase URL:", supabaseUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      console.log("OAuth response:", { data, error })
      setDebugInfo({ data, error, redirectUrl, supabaseUrl })

      if (error) {
        console.error("❌ OAuth initiation error:", error.message)
        alert(`OAuth Error: ${error.message}`)
      } else {
        console.log("✅ OAuth initiation successful")
        console.log("OAuth data:", data)
        console.log("OAuth URL:", data.url)
      }
    } catch (error: any) {
      console.error("❌ Unexpected error:", error)
      alert(`Unexpected Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testSupabaseOAuth = async () => {
    try {
      // Test if Supabase OAuth is configured by checking the providers
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey!}`,
        },
      })

      if (response.ok) {
        const settings = await response.json()
        console.log("Supabase Auth Settings:", settings)
        alert(`Supabase OAuth Settings: ${JSON.stringify(settings.external, null, 2)}`)
      } else {
        console.error("Failed to fetch Supabase settings")
      }
    } catch (error) {
      console.error("Error testing Supabase OAuth:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to MailMinder</CardTitle>
          <CardDescription>Sign in with your Google account to access Gmail and track emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <strong>🔍 Debugging OAuth Issue</strong>
            <br />
            No authorization code received. Let's check the configuration step by step.
          </div>

          <div className="p-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
            <strong>🔧 Configuration URLs:</strong>
            <br />
            <br />
            <strong>1. Supabase Project URL:</strong>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white px-2 py-1 rounded text-xs flex-1">{supabaseUrl || "Not found"}</code>
              {supabaseUrl && (
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(supabaseUrl)}>
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
            <br />
            <strong>2. Google OAuth Redirect URI (add this to Google Console):</strong>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white px-2 py-1 rounded text-xs flex-1">
                {supabaseUrl ? `${supabaseUrl}/auth/v1/callback` : "Configure Supabase URL first"}
              </code>
              {supabaseUrl && (
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${supabaseUrl}/auth/v1/callback`)}>
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
            <br />
            <strong>3. Your App Redirect URL:</strong>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white px-2 py-1 rounded text-xs flex-1">
                {typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "Loading..."}
              </code>
              {typeof window !== "undefined" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(`${window.location.origin}/auth/callback`)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
            <strong>🔍 Quick Links to Check Configuration:</strong>
            <br />
            <br />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://supabase.com/dashboard/project/qstkkltfedhaanztfoje/auth/providers`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Supabase Auth Providers
                  </a>
                </Button>
                <span className="text-xs">← Check Google provider is enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Google Cloud Credentials
                  </a>
                </Button>
                <span className="text-xs">← Check redirect URI is added</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={testSupabaseOAuth}>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Test Supabase OAuth Config
                </Button>
                <span className="text-xs">← Check if OAuth providers are configured</span>
              </div>
            </div>
          </div>

          {debugInfo && (
            <div className="p-4 text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-md">
              <strong>🐛 Last OAuth Attempt Debug Info:</strong>
              <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-12 text-base" variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google (Debug Mode)
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            We'll request Gmail read access to fetch your emails.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
