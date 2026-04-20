'use client';
import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';

export default function Home() {
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkBackendAuth() {
      try {
        // We aren't using the supabase client here! 
        // We are asking our OWN server if we are logged in.
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setBackendUser(data);
        }
      } catch (err) {
        console.error("Backend check failed", err);
      } finally {
        setLoading(false);
      }
    }
    checkBackendAuth();
  }, []);

  if (loading) return <p>Refreshing page...</p>;

  return (
    <main>
      <h1 className='site-title'>Howler</h1>
      <div className="divider" />
      {backendUser?.authenticated ? (
        <div className='welcome'>
          <p>✅ Email: <strong>{backendUser.email}</strong></p>
          <p>Name: {backendUser.name}</p>
          <LogoutButton />
        </div>
      ) : (
        <div className='welcome'>
          <p>❌ Not logged in</p>
          <p>Please log in with your UW Google account.</p>
          <LoginButton />
        </div>
      )}
    </main>
  );
}