'use client';

export default function LoginButton() {
  // Automatically calculates whether the app is on localhost or running live on Vercel
  const getRedirectURL = () => {
    let url = 
      process.env.NEXT_PUBLIC_SITE_URL ??              // Your live production domain link
      process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ??     // Vercel branch preview link (automatic)
      'http://localhost:3000/';                        // Local machine fallback

    // Ensure protocol safety (must have https:// on Vercel)
    url = url.startsWith('http') ? url : `https://${url}`;
    
    // Sanitize trailing slashes cleanly
    url = url.endsWith('/') ? url : `${url}/`;
    
    return `${url}auth/callback`; // Directs user into your authentication callback routing file
  };

  const handleGoogleLogin = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectURL(), // Overrides defaults with your calculated environmental URL
          queryParams: {
            hd: 'uw.edu' // Restricts login accounts explicitly to the UW student domain
          }
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("OAuth authentication cycle failed:", err.message);
    }
  };

  return (
    <button onClick={handleGoogleLogin} className="google-login-btn">
      <img src="/google-logo.png" alt="Google logo" className="google-icon" />
      <span>Sign in with Google</span>
    </button>
  );
}