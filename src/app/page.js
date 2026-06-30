'use client';
import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import UserDropdown from './components/UserDropdown';
import PostFeed from './components/PostFeed';
import MessagesPanel from './components/MessagesPanel';
import Link from 'next/link';
import { getAvatarUrl } from '@/utils/helpers';

export default function Home() {
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('feed');

  useEffect(() => {
    async function checkBackendAuth() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setBackendUser(data);
        }
      } catch (err) {
        console.error('Backend check failed', err);
      } finally {
        setLoading(false);
      }
    }
    checkBackendAuth();
  }, []);

  if (loading) return <p>Refreshing page...</p>;

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
    }
  };

  return (
    <main>
      {backendUser?.authenticated ? (
        <div className="app-shell">
          {/* Left Sidebar */}
          <aside className="left-sidebar">
            <Link href="/" className="logo-link-wrapper sidebar-logo-wrap">
              <img className="logo" src="/icon.png" alt="Howler Logo" />
              <h1 className="signed-in-title">Howler</h1>
            </Link>

            <nav className="sidebar-nav">
              <button
                className={`sidebar-nav-item${activeSection === 'feed' ? ' sidebar-nav-active' : ''}`}
                onClick={() => setActiveSection('feed')}
              >
                🏠 Home
              </button>
              <button
                className={`sidebar-nav-item${activeSection === 'messages' ? ' sidebar-nav-active' : ''}`}
                onClick={() => setActiveSection('messages')}
              >
                💬 Messages
              </button>
              <Link href="/my-profile" className="sidebar-nav-item">
                👤 Profile
              </Link>
            </nav>

            <div className="sidebar-bottom">
              <button className="create-post-btn sidebar-howl-btn" onClick={() => setIsModalOpen(true)}>
                Howl
              </button>
              <div className="sidebar-user-row">
                <img src={getAvatarUrl(backendUser.avatar_url)} alt="Profile" className="profile-pic" />
                <UserDropdown username={backendUser.full_name} />
              </div>
            </div>
          </aside>

          {/* Center Feed */}
          <div className="center-content">
            <div className="feed-search-top">
              <input
                type="text"
                placeholder="Search for posts or users..."
                className="search-bar"
                onKeyDown={handleSearch}
              />
            </div>
            <div className="post-section">
              <PostFeed />
            </div>
          </div>

          {/* Right Panel — DMs */}
          {activeSection === 'messages' && (
            <aside className="right-panel">
              <MessagesPanel currentUserId={backendUser.id} />
            </aside>
          )}
        </div>
      ) : (
        <div className="signed-out">
          <h1 className="site-title">Howler</h1>
          <div className="divider" />
          <div className="welcome">
            <p className="instructions">Please log in with your UW account.</p>
            <LoginButton />
          </div>
        </div>
      )}

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreatePostForm
          onPostCreated={() => { setIsModalOpen(false); window.location.reload(); }}
          onCancel={() => setIsModalOpen(false)}
        />
      </PostModal>
    </main>
  );
}
