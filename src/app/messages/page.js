'use client';
import { Suspense, ViewTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import MessagesPanel from '../components/MessagesPanel';
import { useAuth } from '../components/AuthContext';

function MessagesPanelWithParams({ currentUserId }) {
  const searchParams = useSearchParams();
  const convoId = searchParams.get('convo');
  const initialConvo = convoId ? {
    id: convoId,
    other_user: {
      full_name: searchParams.get('name') || '',
      username: searchParams.get('username') || '',
      avatar_url: searchParams.get('avatar') || '',
    },
  } : null;

  return <MessagesPanel currentUserId={currentUserId} initialConvo={initialConvo} />;
}

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
        <ViewTransition enter="page-in" exit="page-out" default="none">
          <div className='main-feed-area'>
            <Suspense fallback={null}>
              <MessagesPanelWithParams currentUserId={user.id} />
            </Suspense>
          </div>
        </ViewTransition>
      </div>
    </main>
  );
}
