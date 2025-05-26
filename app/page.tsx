import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import AuthButtonServer from "@/components/auth-button-server"
import LoginScreen from "@/components/login-screen"

async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export default async function Home() {
  const session = await getSession()

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
