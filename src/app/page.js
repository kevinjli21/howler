'use client';
import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import UserDropdown from './components/UserDropdown';
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
    // Logged in view
    <main>
      {backendUser?.authenticated ? (
        <div className='signed-in'>
          <nav className='navbar'>
            <div className='logo-container'>
              <h1 className='signed-in-title'><Link className='site-title-link' href="/">
                Howler
              </Link></h1>
            </div>
            <div className='search-container'>
              <input type="text" placeholder="Search for posts or users..." className='search-bar' onKeyDown={handleSearch}/>
            </div>
            <div className='user-info-container'>
                <button 
                  className="create-post-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Howl
                </button>
                <img src={getAvatarUrl(backendUser.avatar_url)} alt="Profile" className='profile-pic' />
                <UserDropdown username={backendUser.full_name} />
            </div>
          </nav>
          <div className='post-section'>
            <PostFeed />
          </div>
        </div>
      ) : (
        // Logged out view
        <div className='signed-out'>
          <h1 className='site-title'>Howler</h1>
          <div className="divider" />
          <div className='welcome'>
            <p className='instructions'>Please log in with your UW Google account.</p>
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