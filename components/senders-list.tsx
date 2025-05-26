"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Sender {
  id: string
  email: string
  name: string
  created_at: string
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

      const { data, error } = await supabase
        .from("senders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching senders:", error)
        return
      }

      setSenders(data || [])
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
      // This is a placeholder for Gmail API integration
      // In a real implementation, you would:
      // 1. Get Gmail API access token
      // 2. Search for emails from the sender
      // 3. Store them in the emails table

      toast({
        title: "Feature Coming Soon",
        description: `Email fetching from ${senderEmail} will be implemented with Gmail API integration`,
      })

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Error fetching emails:", error)
      toast({
        title: "Error",
        description: "Failed to fetch emails",
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
