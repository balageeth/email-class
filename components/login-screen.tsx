"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSession, signIn, signOut } from "next-auth/react"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  const handleSignIn = async (e) => {
    e.preventDefault()
    signIn("credentials", {
      email: email,
      password: password,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        console.error("Sign-in error:", result.error)
        // Handle error (e.g., display an error message)
      } else {
        // Sign-in successful, redirect or update UI
        router.push("/dashboard")
      }
    })
  }

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSignIn}>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  )
}

export default LoginScreen
