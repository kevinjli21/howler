'use client';
import { createClient } from '@/utils/supabase/client';

export default function LoginButton() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
  };

  return <button className="google-btn" onClick={handleLogin}>Sign in with Google</button>;
}