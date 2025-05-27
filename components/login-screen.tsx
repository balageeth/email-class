"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { toast } = useToast()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  useEffect(() => {
    // Check if the user is already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleSignIn = async (type: "email" | "oauth") => {
    setLoading(true)
    setAuthError(null)

    try {
      if (type === "email") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setAuthError(error.message)
        } else {
          router.push("/dashboard")
        }
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
      console.log("🔍 Starting OAuth Flow Debug:")
      console.log("1. Redirect URL:", `${window.location.origin}/auth/callback`)
      console.log("2. Supabase URL:", supabaseUrl)
      console.log("3. Current origin:", window.location.origin)

      // Test the OAuth URL generation first
      console.log("4. Testing OAuth URL generation...")

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false, // Allow redirect
        },
      })

      console.log("5. OAuth response:", { data, error })

      if (error) {
        console.error("6. OAuth error:", error)
        setAuthError(`OAuth Error: ${error.message}`)
        return
      }

      if (data?.url) {
        console.log("7. ✅ OAuth URL generated:", data.url)
        console.log("8. Attempting manual redirect...")

        // Manual redirect as fallback
        window.location.href = data.url
      } else {
        console.error("9. ❌ No OAuth URL generated")
        setAuthError("Failed to generate OAuth URL")
      }
    } catch (err: any) {
      console.error("10. ❌ Unexpected error:", err)
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
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setAuthError(error.message)
      } else {
        toast({
          title: "Success!",
          description: "Check your email to confirm your account.",
        })
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseOAuthConfig = async () => {
    console.log("Supabase URL:", supabaseUrl)
    console.log("Supabase Anon Key:", supabaseAnonKey)
    console.log("Redirect URL:", `${window.location.origin}/auth/callback`)
  }

  const testDirectOAuthURL = async () => {
    try {
      console.log("Testing direct OAuth URL...")

      const redirectTo = encodeURIComponent(`${window.location.origin}/auth/callback`)
      const directUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`

      console.log("Direct OAuth URL:", directUrl)

      // Test if the URL is accessible
      const testResponse = await fetch(directUrl, {
        method: "HEAD",
        headers: {
          apikey: supabaseAnonKey!,
        },
      })

      console.log("Direct URL test status:", testResponse.status)
      console.log("Direct URL test headers:", Object.fromEntries(testResponse.headers.entries()))

      if (testResponse.status === 302 || testResponse.status === 200) {
        console.log("✅ Direct URL appears to work, trying manual redirect...")
        window.location.href = directUrl
      } else {
        console.error("❌ Direct URL test failed")
      }
    } catch (error: any) {
      console.error("Direct URL test error:", error)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back!</CardTitle>
          <CardDescription className="text-center">Enter your email and password to sign in</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
          <Button variant="default" className="w-full" onClick={() => handleSignIn("email")} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleOAuthSignIn} disabled={loading}>
            Google OAuth
          </Button>
          <Button variant="outline" className="w-full" onClick={testDirectOAuthURL} disabled={loading}>
            🔗 Test Direct OAuth URL
          </Button>
          <Button variant="secondary" className="w-full" onClick={testSupabaseOAuthConfig}>
            Test Supabase Config
          </Button>
          <Button variant="link" className="w-full" onClick={handleSignUp} disabled={loading}>
            Don't have an account? Sign up
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginScreen
