'use client';
import { useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import PostFeed from './components/PostFeed';
import MessagesPanel from './components/MessagesPanel';
import Link from 'next/link';
import { getAvatarUrl } from '@/utils/helpers';
import { useAuth } from './components/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('feed');
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
                <img src={getAvatarUrl(user.avatar_url)} alt="Profile" className="profile-pic" />
                <span className="truncate-text" style={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                  {user.full_name}
                </span>
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
              <PostFeed key={feedKey} />
            </div>
          </div>

          {/* Right Panel — DMs */}
          {activeSection === 'messages' && (
            <aside className="right-panel">
              <MessagesPanel currentUserId={user.id} />
            </aside>
          )}
        </div>
      ) : (
        <div className='signed-out'>
          <h1 className='site-title'>Howler</h1>
          <div className="divider" />
          <div className="welcome">
            <p className="instructions">Please log in with your UW account.</p>
            <LoginButton />
          </div>
        </div>
      )}

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreatePostForm
          onPostCreated={() => {
            setIsModalOpen(false);
            setFeedKey(k => k + 1);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </PostModal>
    </main>
  );
}
