'use client';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    
    window.location.assign('/');
  };

  return (
    <button className="google-btn" onClick={handleLogout}>
      Sign Out
    </button>
  );
}