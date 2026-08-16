'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getAvatarUrl } from '@/utils/helpers';
import PostModal from './PostModal';
import CreatePostForm from './CreatePostForm';

export default function Sidebar({ user, activeNav = '', onPostCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const computeUnread = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const convos = await res.json();
      let count = 0;
      convos.forEach(convo => {
        if (!convo.last_message) return;
        if (convo.last_message.sender_id === user.id) return;
        const lastRead = localStorage.getItem(`dm_last_read_${convo.id}`);
        if (!lastRead || new Date(convo.last_message_at) > new Date(lastRead)) count++;
      });
      setUnreadCount(count);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    computeUnread();
    window.addEventListener('dm-read-update', computeUnread);
    return () => window.removeEventListener('dm-read-update', computeUnread);
  }, [computeUnread]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  };

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
      <aside className='sidebar' style={{ viewTransitionName: 'sidebar' }}>
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
            <Link href="/messages" className={`nav-item${activeNav === 'messages' ? ' nav-item-active' : ''}`}>
              <span>💬</span><span>Messages</span>
              {unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </Link>
            <Link href="/my-profile" className={`nav-item${activeNav === 'profile' ? ' nav-item-active' : ''}`}>
              <span>👤</span><span>Profile</span>
            </Link>
            <button className='nav-item nav-item-button' onClick={handleLogout}>
              <span>🚪</span><span>Log Out</span>
            </button>
          </nav>

          <button className="howl-btn" onClick={() => setIsModalOpen(true)}>
            Howl
          </button>
        </div>

        <Link href="/my-profile" className='sidebar-user-section'>
          <img
            src={getAvatarUrl(user?.avatar_url)}
            alt="Profile"
            className='sidebar-avatar'
          />
          <span className='truncate-text' style={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
            {user?.full_name || 'User'}
          </span>
        </Link>
      </aside>

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreatePostForm
          onPostCreated={() => {
            setIsModalOpen(false);
            if (onPostCreated) {
              onPostCreated();
            } else {
              window.location.reload();
            }
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </PostModal>
    </>
  );
}
