'use client';
import Sidebar from '../components/Sidebar';
import MessagesPanel from '../components/MessagesPanel';
import { useAuth } from '../components/AuthContext';

export default function MessagesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main>
      <div className='signed-in'>
        <Sidebar user={user} activeNav='messages' />
        <div className='main-feed-area'>
          <MessagesPanel currentUserId={user.id} />
        </div>
      </div>
    </main>
  );
}
