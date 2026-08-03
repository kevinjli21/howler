'use client';
import { useState, useEffect, ViewTransition } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import CommentsModal from '../components/CommentsModal';
import { getAvatarUrl } from '@/utils/helpers';
import { useAuth } from '../components/AuthContext';

export default function MyProfile() {
    const { user: contextUser, setUser: setContextUser } = useAuth();
    const [backendUser, setBackendUser] = useState(contextUser);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [campuses, setCampuses] = useState([]);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: contextUser?.username || '',
        bio: contextUser?.bio || '',
        campus_id: contextUser?.campus_id || ''
    });

    const [activeTab, setActiveTab] = useState('posts');
    const [likedPosts, setLikedPosts] = useState([]);
    const [loadingLikes, setLoadingLikes] = useState(false);
    const [myOwnPosts, setMyOwnPosts] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [activeCommentPost, setActiveCommentPost] = useState(null);

    useEffect(() => {
        fetch('/api/campuses')
            .then(res => res.ok ? res.json() : [])
            .then(data => setCampuses(data || []))
            .catch(err => console.error("Failed to load campuses", err));
    }, []);

    const fetchLikedPosts = () => {
        setLoadingLikes(true);
        fetch('/api/myprofile/likes')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLikedPosts(data);
                setLoadingLikes(false);
            })
            .catch(err => {
                console.error("Failed to load liked posts:", err);
                setLoadingLikes(false);
            });
    };

    const fetchPersonalTimeline = async () => {
        if (!backendUser?.username) return;
        setLoadingActivity(true);
        try {
            const res = await fetch(`/api/profile?username=${encodeURIComponent(backendUser.username)}`);
            if (res.ok) {
                const data = await res.json();
                setMyOwnPosts(data.posts || []);
            }
        } catch (err) {
            console.error("Failed to pull activity stream:", err);
        } finally {
            setLoadingActivity(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'likes') {
            fetchLikedPosts();
        } else if (activeTab === 'activity') {
            fetchPersonalTimeline();
        }
    }, [activeTab]);

    const handleProfileUnlike = async (post) => {
        setLikedPosts(prev => prev.filter(p => p.id !== post.id));
        if (activeCommentPost?.id === post.id) {
            setActiveCommentPost(null);
        }

        try {
            const res = await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id })
            });
            if (!res.ok) throw new Error('Failed to sync unlike execution');
        } catch (error) {
            console.error(error);
            fetchLikedPosts();
        }
    };

    const handleActivityLike = async (post) => {
        const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
        const currentCount = post.likes?.[0]?.count || 0;
        const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

        setMyOwnPosts(prev => prev.map(p =>
            p.id === post.id
                ? {
                    ...p,
                    likes: [{ count: newCount }],
                    user_has_liked: isCurrentlyLiked ? [] : [{ user_id: backendUser.id }]
                  }
                : p
        ));

        try {
            await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id })
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleActivityDelete = async (postId) => {
        if (!confirm('Are you sure you want to delete this post permanently?')) return;
        setMyOwnPosts(prev => prev.filter(p => p.id !== postId));

        try {
            const res = await fetch(`/api/delete_post?id=${postId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
        } catch (err) {
            console.error(err);
            fetchPersonalTimeline();
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/myprofile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setBackendUser(data);
                setContextUser(data);
                setIsEditing(false);
            } else {
                throw new Error(data.error || 'Failed to update profile changes.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
        if (backendUser) {
            setFormData({
                username: backendUser.username || '',
                bio: backendUser.bio || '',
                campus_id: backendUser.campus_id || ''
            });
        }
    };

    const modalPostSource = activeCommentPost && (
        myOwnPosts.find(p => p.id === activeCommentPost.id) ||
        likedPosts.find(p => p.id === activeCommentPost.id) ||
        activeCommentPost
    );

    if (loading && !backendUser) {
        return (
            <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white' }}>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className='signed-in'>
            <Sidebar user={backendUser} activeNav='profile' />

            <ViewTransition enter="page-in" exit="page-out" default="none">
            <div className='main-feed-area'>
                <div className='feed-sticky-header'>
                    <h2 className='feed-heading'>Profile</h2>
                </div>

                <div className="my-profile-container">
                    <div className="profile-header">
                        {backendUser?.avatar_url && (
                            <img src={getAvatarUrl(backendUser.avatar_url)} alt="Avatar" className="profile-avatar-large" />
                        )}
                        <div className="profile-meta">
                            <h1>{backendUser?.full_name}</h1>
                            <p className="campus-label">
                                📍 {backendUser?.campus?.name || "No campus selected"}
                            </p>
                        </div>
                    </div>

                    <hr />

                    <div className="profile-tabs" style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <button
                            onClick={() => setActiveTab('posts')}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'posts' ? '2px solid #4b2e83' : 'none', fontWeight: activeTab === 'posts' ? 'bold' : 'normal', cursor: 'pointer' }}
                        >
                            My Details
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'activity' ? '2px solid #4b2e83' : 'none', fontWeight: activeTab === 'activity' ? 'bold' : 'normal', cursor: 'pointer' }}
                        >
                            📝 Recent Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('likes')}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'likes' ? '2px solid #4b2e83' : 'none', fontWeight: activeTab === 'likes' ? 'bold' : 'normal', cursor: 'pointer' }}
                        >
                            ❤️ Liked Posts
                        </button>
                    </div>

                    {error && (
                        <div className="error-message" style={{ marginBottom: '1.5rem' }}>
                            {error}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <>
                            <div className="editable-section">
                                <label>Username</label>
                                <p className="display-text">@{backendUser?.username}</p>

                                <label>Campus</label>
                                {isEditing ? (
                                    <select
                                        value={formData.campus_id}
                                        onChange={(e) => setFormData({...formData, campus_id: e.target.value})}
                                        className="edit-input"
                                        disabled={loading}
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
                                        maxLength={160}
                                        disabled={loading}
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
                                        <button onClick={handleCancel} className="cancel-btn" disabled={loading}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="edit-toggle-btn">Edit Profile</button>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <div className="personal-activity-section">
                            {loadingActivity ? (
                                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading your posts...</p>
                            ) : myOwnPosts.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>You haven&apos;t posted anything yet!</p>
                            ) : (
                                myOwnPosts.map(post => {
                                    const hasLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
                                    return (
                                        <article key={post.id} className="post-card" style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                                            {post.categories?.category_name && (
                                                <span
                                                    className="category-badge"
                                                    style={{ backgroundColor: post.categories.color || '#4b5563', color: '#ffffff', position: 'absolute', top: '1rem', right: '1rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}
                                                >
                                                    {post.categories.category_name}
                                                </span>
                                            )}

                                            <div className="post-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <img
                                                    src={getAvatarUrl(backendUser.avatar_url)}
                                                    alt="avatar"
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '0.5rem', objectFit: 'cover' }}
                                                />
                                                <strong>{backendUser.full_name}</strong>
                                                <span style={{ color: '#64748b', marginLeft: '0.25rem', fontSize: '0.85rem' }}>@{backendUser.username}</span>
                                            </div>

                                            <p style={{ margin: '0.5rem 0', color: '#0f172a', lineBreak: 'anywhere' }}>{post.content}</p>

                                            {post.image_url && (
                                                <img src={post.image_url} alt="Attached resource" style={{ maxWidth: '100%', borderRadius: '6px', marginTop: '0.5rem', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                                            )}

                                            <div className="post-interactions" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', alignItems: 'center', fontSize: '0.95rem' }}>
                                                <div onClick={() => handleActivityLike(post)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <span style={{ color: hasLiked ? '#ff4b4b' : 'inherit' }}>{hasLiked ? '❤️' : '🤍'}</span>
                                                    <span style={{ color: '#4b5563' }}>{post.likes?.[0]?.count || 0}</span>
                                                </div>
                                                <div onClick={() => setActiveCommentPost(post)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4b5563' }}>
                                                    <span>💬</span>
                                                    <span>{post.comments?.[0]?.count || 0}</span>
                                                </div>
                                                <div onClick={() => handleActivityDelete(post.id)} style={{ cursor: 'pointer', color: '#dc2626', marginLeft: 'auto' }} title="Delete post">
                                                    <span>🗑️</span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'likes' && (
                        <div className="liked-posts-section">
                            {loadingLikes ? (
                                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading liked posts...</p>
                            ) : likedPosts.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>You haven&apos;t liked any posts yet!</p>
                            ) : (
                                likedPosts.map(post => {
                                    const authorUsername = post.profiles?.username || '';
                                    const profileLink = `/profile/${encodeURIComponent(authorUsername)}`;

                                    return (
                                        <article key={post.id} className="post-card" style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                                            {post.categories?.category_name && (
                                                <span
                                                    className="category-badge"
                                                    style={{ backgroundColor: post.categories.color || '#4b5563', color: '#ffffff', position: 'absolute', top: '1rem', right: '1rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}
                                                >
                                                    {post.categories.category_name}
                                                </span>
                                            )}

                                            <div className="post-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                {post.profiles?.avatar_url && (
                                                    <img
                                                        src={getAvatarUrl(post.profiles.avatar_url)}
                                                        alt="avatar"
                                                        style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '0.5rem', objectFit: 'cover' }}
                                                    />
                                                )}
                                                <h3 className="post-author" style={{ margin: 0, fontSize: '1rem' }}>
                                                    <Link href={profileLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                                                            {post.profiles?.full_name || 'Anonymous'}
                                                        </span>
                                                    </Link>
                                                    {post.profiles?.username && (
                                                        <Link href={profileLink} style={{ textDecoration: 'none' }}>
                                                            <span className="post-username" style={{ color: '#64748b', marginLeft: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                                @{post.profiles.username}
                                                            </span>
                                                        </Link>
                                                    )}
                                                </h3>
                                            </div>

                                            <p style={{ margin: '0.5rem 0', color: '#0f172a', lineBreak: 'anywhere' }}>{post.content}</p>

                                            {post.image_url && (
                                                <img src={post.image_url} alt="Post attachment" style={{ maxWidth: '100%', borderRadius: '6px', marginTop: '0.5rem', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                                            )}

                                            <div className="post-interactions" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', alignItems: 'center', fontSize: '0.95rem' }}>
                                                <div onClick={() => handleProfileUnlike(post)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }} title="Unlike this post">
                                                    <span style={{ color: '#ff4b4b' }}>❤️</span>
                                                    <span style={{ color: '#4b5563' }}>{post.likes?.[0]?.count || 0}</span>
                                                </div>
                                                <div onClick={() => setActiveCommentPost(post)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4b5563' }}>
                                                    <span>💬</span>
                                                    <span>{post.comments?.[0]?.count || 0}</span>
                                                </div>
                                                <small style={{ marginLeft: 'auto', color: '#64748b' }}>
                                                    {new Date(post.posted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </small>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeCommentPost && (
                        <CommentsModal
                            post={modalPostSource}
                            currentUserId={backendUser?.id}
                            onClose={() => setActiveCommentPost(null)}
                            onLike={activeTab === 'likes' ? handleProfileUnlike : handleActivityLike}
                            onDeletePost={activeTab === 'activity' ? handleActivityDelete : null}
                        />
                    )}
                </div>
            </div>
            </ViewTransition>
        </div>
    );
}
