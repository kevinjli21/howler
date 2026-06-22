'use client';
import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import PostFeed from './components/PostFeed';
import Link from 'next/link';
import { getAvatarUrl } from '@/utils/helpers';

export default function Home() {
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    async function checkBackendAuth() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          console.log("Backend auth check response:", data);
          setBackendUser(data);
        }
      } catch (err) {
        console.error("Backend check failed", err);
      } finally {
        setLoading(false);
      }
    }
    checkBackendAuth();
  }, []); // Check for auth from backend when initially loading

  if (loading) return <p>Refreshing page...</p>;

const handleSearch = (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value;
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  }
};

  return (
    <main>
      {backendUser?.authenticated ? (
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
                src={getAvatarUrl(backendUser.avatar_url)}
                alt="Profile"
                className='sidebar-avatar'
              />
              <span className='truncate-text' style={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                {backendUser.full_name}
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
        // Logged out view
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
              window.location.reload(); // Only reload on success
          }}
          onCancel={() => {
              setIsModalOpen(false); // Just close the modal, no refresh
          }}
        />
      </PostModal>
    </main>
  );
}