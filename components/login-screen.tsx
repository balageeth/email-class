"use client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const testSupabaseOAuth = async () => {
  try {
    console.log("Testing Supabase OAuth with detailed debugging...")
    console.log("Supabase URL:", supabaseUrl)
    console.log("Supabase Anon Key:", supabaseAnonKey?.substring(0, 20) + "...")

    // Test if Supabase OAuth is configured by checking the providers
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey!,
        Authorization: `Bearer ${supabaseAnonKey!}`,
      },
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const settings = await response.json()
      console.log("Full Supabase Auth Settings:", JSON.stringify(settings, null, 2))

      // Check specifically for Google provider
      const googleProvider = settings.external?.google
      console.log("Google provider object:", googleProvider)

      if (googleProvider) {
        const detailedInfo = `✅ Google Provider Found!

Enabled: ${googleProvider.enabled}
Client ID: ${googleProvider.client_id ? `Set (${googleProvider.client_id.substring(0, 20)}...)` : "Missing"}
Redirect URI: ${googleProvider.redirect_uri || "Not set"}

Full Google Config:
${JSON.stringify(googleProvider, null, 2)}`

        alert(detailedInfo)
      } else {
        alert(
          `❌ Google Provider Not Found!

Available providers: ${Object.keys(settings.external || {}).join(", ")}

Full external config:
${JSON.stringify(settings.external, null, 2)}`,
        )
      }
    } else {
      const errorText = await response.text()
      console.error("Failed to fetch Supabase settings:", response.status, errorText)
      alert(`Failed to fetch Supabase settings: ${response.status}\n\nError: ${errorText}`)
    }
  } catch (error) {
    console.error("Error testing Supabase OAuth:", error)
    alert(`Error testing Supabase OAuth: ${error}`)
  }
}

const LoginScreen = () => {
  return (
    <div>
      <h1>Login Screen</h1>
      <button onClick={testSupabaseOAuth}>Test Supabase OAuth</button>
    </div>
  )
}

export default LoginScreen
