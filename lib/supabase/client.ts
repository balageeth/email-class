import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Fallback to regular createClient if @supabase/ssr is not available
  try {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  } catch {
    // Fallback to the old method
    const { createClient } = require("@supabase/supabase-js")
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
}
