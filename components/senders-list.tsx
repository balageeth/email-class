"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Trash2, RefreshCw, Loader2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Sender {
  id: string
  email: string
  name: string
  created_at: string
  email_count?: number
}

interface SendersListProps {
  refreshTrigger: number
}

export function SendersList({ refreshTrigger }: SendersListProps) {
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingEmails, setFetchingEmails] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSenders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch senders with email count
      const { data, error } = await supabase
        .from("senders")
        .select(`
          *,
          emails(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching senders:", error)
        return
      }

      // Transform the data to include email count
      const sendersWithCount =
        data?.map((sender) => ({
          ...sender,
          email_count: sender.emails?.[0]?.count || 0,
        })) || []

      setSenders(sendersWithCount)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSenders()
  }, [refreshTrigger])

  const deleteSender = async (senderId: string) => {
    try {
      const { error } = await supabase.from("senders").delete().eq("id", senderId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete sender",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Sender deleted successfully",
      })

      fetchSenders()
    } catch (error) {
      console.error("Error deleting sender:", error)
    }
  }

  const fetchEmailsFromSender = async (senderId: string, senderEmail: string) => {
    setFetchingEmails(senderId)

    try {
      // Get the current session to include in the request
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("No active session. Please sign in again.")
      }

      const response = await fetch("/api/fetch-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the authorization header with the access token
          Authorization: `Bearer ${session.access_token}`,
        },
        // Include credentials to send cookies
        credentials: "include",
        body: JSON.stringify({
          senderId,
          senderEmail,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch emails")
      }

      toast({
        title: "Success",
        description: `Fetched ${result.emailsFetched} emails, stored ${result.emailsStored} new emails`,
      })

      // Refresh the senders list to update email counts
      fetchSenders()
    } catch (error: any) {
      console.error("Error fetching emails:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch emails",
        variant: "destructive",
      })
    } finally {
      setFetchingEmails(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Senders ({senders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {senders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No senders added yet</p>
            <p className="text-sm">Add a sender to start tracking their emails</p>
          </div>
        ) : (
          <div className="space-y-4">
            {senders.map((sender) => (
              <div key={sender.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{sender.name}</h3>
                    <Badge variant="secondary">{sender.email}</Badge>
                    {sender.email_count > 0 && <Badge variant="outline">{sender.email_count} emails</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(sender.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmailsFromSender(sender.id, sender.email)}
                    disabled={fetchingEmails === sender.id}
                  >
                    {fetchingEmails === sender.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Fetch Emails
                      </>
                    )}
                  </Button>
                  {sender.email_count > 0 && (
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Emails
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => deleteSender(sender.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
