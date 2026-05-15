'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserDropdown from '../components/UserDropdown';
import { getAvatarUrl } from '@/utils/helpers';

export default function MyProfile() {
    const [backendUser, setBackendUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [campuses, setCampuses] = useState([]); // State to store all campus options

    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        campus_id: ''
    });


    useEffect(() => {
        async function fetchProfileAndCampuses() {
            try {
                const [profileRes, campusRes] = await Promise.all([
                    fetch('/api/myprofile'),
                    fetch('/api/campuses')
                ]);

                if (profileRes.ok && campusRes.ok) {
                    const profileData = await profileRes.json();
                    const campusData = await campusRes.json();

                    setBackendUser(profileData);
                    setCampuses(campusData || []); 
                    
                    // Initialize form with fetched profile data
                    setFormData({
                        username: profileData.username || '',
                        bio: profileData.bio || '',
                        campus_id: profileData.campus_id || ''
                    });
                }
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfileAndCampuses();
    }, []);
    

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/myprofile', {
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setBackendUser(updatedUser);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    };

    if (!backendUser) return <div className="search-page-layout">Verifying session...</div>;
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <p>Loading your UW Howler profile...</p>
            </div>
        );
    }


    return (
        <div>
            <nav className='navbar'>
            <Link href="/" className='logo-link-wrapper'>
              <div className='logo-container'>
                <img className='logo' src="/icon.png" alt="Howler Logo" />
                <h1 className='signed-in-title'>Howler</h1>
              </div>
            </Link>
            <div className='search-container'>
              <input type="text" placeholder="Search for posts or users..." className='search-bar' onKeyDown={handleSearch}/>
            </div>
            <div className='user-info-container'>
                <img src={getAvatarUrl(backendUser.avatar_url)} alt="Profile" className='profile-pic' />
                <UserDropdown username={backendUser.full_name} />
            </div>
          </nav>
            <div className="my-profile-container">
                <div className="profile-header">
                    {backendUser?.avatar_url && (
                        <img src={getAvatarUrl(backendUser.avatar_url)} alt="Avatar" className="profile-avatar-large" />
                    )}
                    <div className="profile-meta">
                        <h1>{backendUser?.full_name}</h1>
                        {/* Display current campus name from the join */}
                        <p className="campus-label">
                            📍 {backendUser?.campus?.name || "No campus selected"}
                        </p>
                    </div>
                </div>

                <hr />

                <div className="editable-section">
                    <label>Username</label>
                    <p className="display-text">@{backendUser?.username}</p>

                    <label>Campus</label>
                    {isEditing ? (
                        <select 
                            value={formData.campus_id}
                            onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                            className="edit-input"
                        >
                            <option value="">Select your campus</option>
                            {campuses.map((c) => (
                                <option key={c.campus_id} value={c.campus_id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="display-text">{backendUser?.campus?.name || "Not yet selected"}</p>
                    )}

                    <label>Bio</label>
                    {isEditing ? (
                        <textarea 
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            className="edit-textarea"
                        />
                    ) : (
                        <p className="display-text">{backendUser?.bio || "No bio yet..."}</p>
                    )}
                </div>

                <div className="profile-actions">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="save-btn" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="edit-toggle-btn">Edit Profile</button>
                    )}
                </div>
            </div>
        </div>
    );
}