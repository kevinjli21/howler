'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; 

export default function UserDropdown({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const supabase = createClient(); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign('/'); 
  };

  return (
    <div ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate-text">{username}</span>
        <span className={`dropdown-arrow ${isOpen ? 'is-open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
            <Link href="/my-profile" className="dropdown-item">
            My Profile
            </Link>
            <Link href="/settings" className="dropdown-item">
            Settings
            </Link>
            
            <div className="dropdown-divider" />
            
            <button onClick={handleLogout} className="logout-item">
            Logout
            </button>
        </div>
        )}
    </div>
  );
}