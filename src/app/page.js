'use client';
import { useState, ViewTransition } from 'react';
import LoginButton from './components/LoginButton';
import PostFeed from './components/PostFeed';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import { useAuth } from './components/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const [feedKey, setFeedKey] = useState(0);

  if (loading) {
    return <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white' }}>Loading home feed...</p>
    </div>;
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value;
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <main>
      {user ? (
        <div className='signed-in'>
          <Sidebar user={user} activeNav='home' onPostCreated={() => setFeedKey(k => k + 1)} />

          <ViewTransition enter="page-in" exit="page-out" default="none">
            <div className='main-feed-area'>
              <div className='feed-sticky-header'>
                <div className='feed-header-top'>
                  <Link href="/" className='mobile-logo-link'>
                    <img className='mobile-header-logo' src="/icon.png" alt="Howler" />
                  </Link>
                  <h2 className='feed-heading'>Home</h2>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className='mobile-header-search'
                  onKeyDown={handleSearch}
                />
              </div>
              <PostFeed key={feedKey} />
            </div>
          </ViewTransition>

        </div>
      ) : (
        <div className='signed-out'>
          <h1 className='site-title'>Howler</h1>
          <div className="divider" />
          <div className='welcome'>
            <p className='instructions'>Please log in with your UW account.</p>
            <LoginButton />
          </div>
        </div>
      )}
    </main>
  );
}
