'use client';
import { createClient } from '@/utils/supabase/client';

export default function LoginButtons() {
  const supabase = createClient();

  // --- GOOGLE SIGN IN ---
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // FORCES LOCALHOST FOR GOOGLE
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        queryParams: { hd: 'uw.edu' }
      },
    });
  };

  // --- AZURE SIGN IN ---
  const handleAzureLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        // FORCES LOCALHOST FOR AZURE (Restores the ?next=/ token your route handler expects)
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        scopes: 'email openid profile', // Enforces email retrieval from UW NetID profiles
      },
    });
  };

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button className="google-btn" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>

      <button className="google-btn" onClick={handleAzureLogin}>
        Sign in with Azure
      </button>
    </div>
  );
}