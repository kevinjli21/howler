'use client'
import { createClient } from '@/utils/supabase/client'

export default function Login() {
  const supabase = createClient()

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div>
      <h1>Welcome To Howler</h1>
      <h2>Please sign in with your UW email</h2>
      <button onClick={signInWithGoogle} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        Sign in with Google
      </button>
    </div>
  )
}