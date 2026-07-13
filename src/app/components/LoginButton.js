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
        redirectTo: 'https://howler-teal.vercel.app/auth/callback?next=/',
        queryParams: { hd: 'uw.edu' }
      },
    });
  };

  // --- MICROSOFT SIGN IN ---
  const handleMicrosoftLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        // FORCES LOCALHOST FOR AZURE (Restores the ?next=/ token your route handler expects)
        redirectTo: 'https://howler-teal.vercel.app/auth/callback?next=/',
        scopes: 'email openid profile', // Enforces email retrieval from UW NetID profiles
        tenant: 'f6b6dd5b-f02f-441a-99a0-162ac5060bd2', // UW's Azure tenant ID
      },
    });
  };

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button className="google-btn" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>

      <button className="google-btn" onClick={handleMicrosoftLogin}>
        Sign in with Microsoft
      </button>

      <p className="auth-legal-text">
        By signing in, you agree to our{' '}
        <a href="/terms" className="auth-legal-link">Terms of Use</a>
        {' '}and{' '}
        <a href="/privacy-policy" className="auth-legal-link">Privacy Policy</a>.
      </p>
    </div>
  );
}