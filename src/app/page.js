'use client';
import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PostModal from './components/PostModal';
import CreatePostForm from './components/CreatePostForm';
import UserDropdown from './components/UserDropdown';

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
  }, []);

  if (loading) return <p>Refreshing page...</p>;

  return (
    <main>
      {backendUser?.authenticated ? (
        <div className='signed-in'>
          <h1 className='signed-in-title'>Howler</h1>
          
          <header className='user-info'>
            <button 
              className="create-post-btn"
              onClick={() => setIsModalOpen(true)}
            >
              Howl
            </button>
            <img src={backendUser.avatar} alt="Profile" className='profile-pic' />
            <UserDropdown username={backendUser.name} />
          </header>
        </div>
      ) : (
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