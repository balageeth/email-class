"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkSession = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      // Also check stored tokens
      let storedToken = null
      if (user) {
        const { data: tokenData, error: tokenError } = await supabase
          .from("user_tokens")
          .select("provider, expires_at, created_at")
          .eq("user_id", user.id)
          .eq("provider", "google")
          .single()

        storedToken = {
          hasStoredToken: !!tokenData,
          tokenError: tokenError?.message,
          expiresAt: tokenData?.expires_at,
          createdAt: tokenData?.created_at,
        }
      }

      setSessionInfo({
        hasSession: !!session,
        hasUser: !!user,
        hasProviderToken: !!session?.provider_token,
        provider: session?.provider,
        userEmail: user?.email,
        sessionError: error,
        userError: userError,
        tokenLength: session?.provider_token?.length || 0,
        storedToken,
      })
    } catch (error: any) {
      console.error("Error checking session:", error)
      setSessionInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Debug Session Info
          <Button onClick={checkSession} disabled={loading} size="sm">
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(sessionInfo, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}
