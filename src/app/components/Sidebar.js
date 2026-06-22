'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getAvatarUrl } from '@/utils/helpers';
import UserDropdown from './UserDropdown';
import PostModal from './PostModal';
import CreatePostForm from './CreatePostForm';

export default function Sidebar({ user, activeNav = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value;
      if (val.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(val)}`;
      }
    }
  };

  return (
    <>
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
            <Link href="/" className={`nav-item${activeNav === 'home' ? ' nav-item-active' : ''}`}>
              <span>🏠</span><span>Home</span>
            </Link>
            <Link href="/my-profile" className={`nav-item${activeNav === 'profile' ? ' nav-item-active' : ''}`}>
              <span>👤</span><span>Profile</span>
            </Link>
          </nav>

          <button className="howl-btn" onClick={() => setIsModalOpen(true)}>
            Howl
          </button>
        </div>

        <div className='sidebar-user-section'>
          <img
            src={getAvatarUrl(user?.avatar_url)}
            alt="Profile"
            className='sidebar-avatar'
          />
          <UserDropdown username={user?.full_name || 'User'} />
        </div>
      </aside>

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreatePostForm
          onPostCreated={() => {
            setIsModalOpen(false);
            window.location.reload();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </PostModal>
    </>
  );
}
