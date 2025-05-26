"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import AuthButtonServer from "@/components/auth-button-server"
import LoginScreen from "@/components/login-screen"

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
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
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

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
        <LoginScreen />
      )}
    </div>
  )
}
