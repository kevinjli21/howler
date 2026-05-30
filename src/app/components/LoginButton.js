'use client';
import { createClient } from '@/utils/supabase/client';

export default function LoginButton() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 1. Keeps your original, automatic domain utility with the critical ?next=/ parameter
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        // queryParams: {
        //   // 2. Restricts the OAuth portal strictly to UW student/faculty email domains
        //   hd: 'uw.edu'
        // }
      },
    });
  };

  return (
    <button className="google-btn" onClick={handleLogin}>
      Sign in with Google
    </button>
  );
}