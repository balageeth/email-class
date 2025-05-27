import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // Return existing instance if it exists (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if one doesn't exist
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  )

  return supabaseInstance
}
