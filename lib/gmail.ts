import { google } from "googleapis"

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
    }
    parts?: Array<{
      mimeType: string
      body: {
        data?: string
      }
    }>
  }
  internalDate: string
}

export class GmailService {
  private oauth2Client: any

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2()
    this.oauth2Client.setCredentials({ access_token: accessToken })
  }

  async searchEmails(senderEmail: string, maxResults = 50): Promise<GmailMessage[]> {
    try {
      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client })

      // Search for emails from the specific sender
      const query = `from:${senderEmail}`

      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      })

      if (!response.data.messages) {
        return []
      }

      // Fetch full message details for each email
      const messages = await Promise.all(
        response.data.messages.map(async (message) => {
          const fullMessage = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          })
          return fullMessage.data as GmailMessage
        }),
      )

      return messages
    } catch (error) {
      console.error("Error fetching emails from Gmail:", error)
      throw error
    }
  }

  extractEmailContent(message: GmailMessage): {
    subject: string
    from: string
    date: string
    body: string
  } {
    const headers = message.payload.headers
    const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject"
    const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender"
    const date = headers.find((h) => h.name === "Date")?.value || message.internalDate

    let body = ""

    // Extract body content
    if (message.payload.body?.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8")
    } else if (message.payload.parts) {
      // Look for text/plain or text/html parts
      const textPart = message.payload.parts.find(
        (part) => part.mimeType === "text/plain" || part.mimeType === "text/html",
      )
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8")
      }
    }

    return { subject, from, date, body }
  }
}
