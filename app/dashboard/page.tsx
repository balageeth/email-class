"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { LogOut, Mail } from "lucide-react"
import { AddSenderDialog } from "@/components/add-sender-dialog"
import { SendersList } from "@/components/senders-list"
import { Toaster } from "@/components/ui/toaster"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (!user) {
        router.push("/")
      }
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">MailMinder Dashboard</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Email Senders</h2>
                <AddSenderDialog onSenderAdded={() => setRefreshTrigger((prev) => prev + 1)} />
              </div>

              <SendersList refreshTrigger={refreshTrigger} />
            </div>

            <Toaster />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
