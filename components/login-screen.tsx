"use client"

import { useState } from "react"

import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginScreen({ error }: { error?: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(error || null)
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { toast } = useToast()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [oauthUrl, setOauthUrl] = useState<string>("")

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push("/")
      }
    }
    getUser()
  }, [supabase, router])

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      toast({
        title: "Success!",
        description: "You have successfully signed in.",
      })
      router.push("/")
    }

    setLoading(false)
  }

  const handleOAuthSignIn = async () => {
    setLoading(true)
    setAuthError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setAuthError(error.message)
    }

    setLoading(false)
  }

  const testSupabaseOAuthConfig = async () => {
    try {
      console.log("Testing Supabase OAuth configuration...")

      // Test the Supabase auth settings endpoint
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey!,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const settings = await response.json()
      console.log("Full Supabase Auth Settings:", settings)

      // Check Google provider specifically
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

  const handleOAuthSignInWithLogging = async () => {
    setLoading(true)
    setAuthError(null)

    try {
      // Create the OAuth URL manually to log it
      const redirectTo = `${window.location.origin}/auth/callback`
      const baseUrl = `${supabaseUrl}/auth/v1/authorize`

      console.log("🔍 OAuth Flow Debug:")
      console.log("Redirect URL:", redirectTo)
      console.log("Supabase URL:", supabaseUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
        },
      })

      console.log("OAuth response:", { data, error })

      if (error) {
        setAuthError(error.message)
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative flex h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:px-0">
      <Card className="w-[340px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your email and password to sign in</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="m@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
          {authError && <p className="text-red-500">{authError}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSignIn} disabled={loading}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
      <div className="mx-auto flex w-[340px] flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleOAuthSignInWithLogging} disabled={loading}>
            Google OAuth (Enhanced)
          </Button>

          <Button variant="secondary" className="w-full" onClick={testSupabaseOAuthConfig} disabled={loading}>
            Test Supabase OAuth Config
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">OAuth Configuration Debug:</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
