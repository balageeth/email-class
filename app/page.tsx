"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AuthButtonServer from "@/components/auth-button-server"
import LoginScreen from "@/components/login-screen"

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get("error")
    if (errorParam === "no_code") {
      setError("OAuth authorization was not completed. Please try signing in again.")
    } else if (errorParam) {
      setError(`Authentication error: ${errorParam}`)
    }

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          console.log("✅ Session found, redirecting to dashboard")
          router.push("/dashboard")
          return
        }

        setSession(session)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change:", event, !!session)
      if (event === "SIGNED_IN" && session) {
        router.push("/dashboard")
      } else {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      {session ? (
        <div className="flex flex-col items-center justify-center">
          <p>Welcome, {session.user.email}!</p>
          <AuthButtonServer />
        </div>
      ) : (
        <LoginScreen error={error} />
      )}
    </div>
  )
}
