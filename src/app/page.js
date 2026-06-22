'use client';
import { useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import PostFeed from './components/PostFeed';
import Link from 'next/link';
import { getAvatarUrl } from '@/utils/helpers';
import { useAuth } from './components/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white' }}>Loading your profile...</p>
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
          <aside className='sidebar'>
            <div className='sidebar-top'>
              <Link href="/" className='logo-link-wrapper'>
                <div className='sidebar-logo'>
                  <img className='logo' src="/icon.png" alt="Howler Logo" />
                  <h1 className='signed-in-title sidebar-title'>Howler</h1>
                </div>
              </Link>

              <div className='sidebar-search'>
                <input
                  type="text"
                  placeholder="Search..."
                  className='search-bar'
                  onKeyDown={handleSearch}
                />
              </div>

              <nav className='sidebar-nav'>
                <Link href="/" className='nav-item nav-item-active'>
                  <span>🏠</span><span>Home</span>
                </Link>
                <Link href="/my-profile" className='nav-item'>
                  <span>👤</span><span>Profile</span>
                </Link>
              </nav>

              <button className="howl-btn" onClick={() => setIsModalOpen(true)}>
                Howl
              </button>
            </div>

            <div className='sidebar-user-section'>
              <img
                src={getAvatarUrl(user.avatar_url)}
                alt="Profile"
                className='sidebar-avatar'
              />
              <span className='truncate-text' style={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                {user.full_name}
              </span>
            </div>
          </aside>

          <div className='main-feed-area'>
            <div className='feed-sticky-header'>
              <h2 className='feed-heading'>Home</h2>
            </div>
            <PostFeed />
          </div>
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
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreatePostForm
          onPostCreated={() => {
              setIsModalOpen(false);
              window.location.reload();
          }}
          onCancel={() => {
              setIsModalOpen(false);
          }}
        />
      </PostModal>
    </main>
  );
}
