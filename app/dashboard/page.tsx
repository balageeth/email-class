import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DebugSession } from "@/components/debug-session"

export default async function Dashboard() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const { user } = session

  return (
    <div className="container py-10">
      <div className="grid gap-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Name:</strong> {user?.user_metadata?.full_name || "Not provided"}
              </p>
              <p>
                <strong>Last sign in:</strong>{" "}
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>

        <DebugSession />
      </div>
    </div>
  )
}
