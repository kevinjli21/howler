'use client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });

    window.location.assign('/');
  };

  return (
    <button className="google-btn" onClick={handleLogout}>
      Sign Out
    </button>
  );
}