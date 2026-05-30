'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import UserDropdown from '../components/UserDropdown';
import CommentsModal from '../components/CommentsModal'; 
import { getAvatarUrl } from '@/utils/helpers';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const [backendUser, setBackendUser] = useState(null);
    const query = searchParams.get('q');
    const [results, setResults] = useState({ profiles: [], posts: [] });
    const [loading, setLoading] = useState(true);
    
    // Track modal and like interaction context states
    const [activeCommentPost, setActiveCommentPost] = useState(null);

    // 1. Fetch Search Results (including image_url and nested relations)
    useEffect(() => {
        if (query) {
            setLoading(true);
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Search failed", err);
                    setLoading(false);
                });
        }
    }, [query]);

    // 2. Fetch Current User Auth
    useEffect(() => {
        async function fetchMyAuth() {
            try {
                const res = await fetch('/api/myprofile'); 
                if (res.ok) {
                    const data = await res.json();
                    setBackendUser(data);
                }
            } catch (err) {
                console.error("Auth fetch failed", err);
            }
        }
        fetchMyAuth();
    }, []);

    // Interactive internal search timeline like framework handler
    const handleSearchPostLike = async (post) => {
        if (!backendUser) return;
        
        const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
        const newCount = isCurrentlyLiked 
            ? Math.max(0, (post.likes?.[0]?.count || 0) - 1) 
            : (post.likes?.[0]?.count || 0) + 1;

        // Optimistic State Mutation
        setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p => 
                p.id === post.id 
                    ? { 
                        ...p, 
                        likes: [{ count: newCount }], 
                        user_has_liked: isCurrentlyLiked ? [] : [{ user_id: backendUser.id }] 
                      } 
                    : p
            )
        }));

        try {
            const res = await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id })
            });
            if (!res.ok) throw new Error('Failed to synchronize like status.');
        } catch (error) {
            console.error(error);
        }
    };

    if (!backendUser && loading) return <div className="search-page-layout">Verifying session...</div>;

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value;
            if (val.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(val)}`;
            }
        }
    };

    return (
        <div>
            {/* Navbar Section */}
            <nav className='navbar'>
                <Link href="/" className='logo-link-wrapper'>
                    <div className='logo-container'>
                        <img className='logo' src="/icon.png" alt="Howler Logo" />
                        <h1 className='signed-in-title'>Howler</h1>
                    </div>
                </Link>

                <div className='search-container'>
                    <input 
                        type="text" 
                        placeholder="Search for posts or users..." 
                        className='search-bar' 
                        onKeyDown={handleSearch}
                        defaultValue={query || ''}
                    />
                </div>
                
                <div className='user-info-container'>
                    <img 
                        src={getAvatarUrl(backendUser?.avatar_url)} 
                        alt="Profile" 
                        className='profile-pic' 
                    />
                    <UserDropdown username={backendUser?.full_name || 'User'} />
                </div>
            </nav>

            {/* Main Content Layout */}
            <div className="search-page-layout">
                <h1 className="results-heading">Results for "{query}"</h1>

                {/* Users Section */}
                <section className="search-results-section">
                    <h2>Users</h2>
                    <div className="search-user-list">
                        {results.profiles.length > 0 ? (
                            results.profiles.map(user => {
                                const targetUserPath = backendUser && user.id === backendUser.id 
                                    ? '/myprofile' 
                                    : `/profile/${user.username}`;

                                return (
                                    <Link href={targetUserPath} key={user.id} className="search-user-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
                                        <img 
                                            src={getAvatarUrl(user.avatar_url)} 
                                            alt={user.username} 
                                            className="profile-avatar-large" 
                                        />
                                        <div>
                                            <p className="full-name" style={{ fontWeight: 'bold', margin: 0 }}>{user.full_name}</p>
                                            <p className="username" style={{ color: '#64748b', margin: 0 }}>@{user.username}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <p className="no-results-text">No users found.</p>
                        )}
                    </div>
                </section>

                {/* Posts Section */}
                <section className="search-results-section">
                    <h2>Posts</h2>
                    <div className="search-post-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? <p>Loading posts...</p> : (
                            results.posts.length > 0 ? (
                                <>
                                    {results.posts.map(post => {
                                        const hasLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
                                        
                                        // Bulletproof fallback verification check
                                        const isMyPost = !!backendUser?.id && !!post.user_id && post.user_id === backendUser.id;

                                        // 2. DEBUGGER LOG: Open your browser console (F12) to see exactly what IDs are fighting
                                        console.log("--- Debugging Post Ownership ---", {
                                            postContent: post.content?.substring(0, 15),
                                            postOwnerId: post.user_id,
                                            myCurrentId: backendUser?.id,
                                            doTheyMatch: isMyPost
                                        });
                                        
                                        const postAuthorPath = isMyPost 
                                            ? '/myprofile' 
                                            : `/profile/${post.profiles?.username}`;

                                        return (
                                            <article key={post.id} className="post-card">
                                                {post.categories?.category_name && (
                                                    <span 
                                                        className="category-badge"
                                                        style={{ 
                                                            backgroundColor: post.categories.color || '#4b5563',
                                                            color: '#ffffff',
                                                        }}
                                                    >
                                                        {post.categories.category_name}
                                                    </span>
                                                )}

                                                {/* FIXED: Closed the header container strictly right after the meta information ends */}
                                                <div className="post-header">
                                                    <Link href={postAuthorPath}>
                                                        <img 
                                                            src={getAvatarUrl(post.profiles?.avatar_url)} 
                                                            alt={post.profiles?.full_name || 'User avatar'} 
                                                            className="avatar-img"
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </Link>
                                                    <h3 className="post-author">
                                                        <Link href={postAuthorPath} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            <span style={{ fontWeight: 'bold' }}>{post.profiles?.full_name || 'Anonymous'}</span>
                                                        </Link>
                                                        {post.profiles?.username && (
                                                            <Link href={postAuthorPath} style={{ textDecoration: 'none' }}>
                                                                <span className="post-username"> @{post.profiles.username}</span>
                                                            </Link>
                                                        )}
                                                    </h3>
                                                </div>

                                                {/* FIXED: Placed content elements out here, perfectly mimicking PostFeed */}
                                                <p>{post.content}</p>

                                                {post.image_url && (
                                                    <img 
                                                        src={post.image_url} 
                                                        alt="Post attachment" 
                                                        className="post-image"
                                                    />
                                                )}

                                                <small>
                                                    {new Date(post.posted_at).toLocaleString([], { 
                                                        dateStyle: 'short', 
                                                        timeStyle: 'short' 
                                                    })}
                                                </small>

                                                {/* Post Action Toolbar */}
                                                <div className="post-interactions" style={{ marginTop: '0.75rem' }}>
                                                    <div 
                                                        className="interaction-item" 
                                                        onClick={() => handleSearchPostLike(post)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span style={{ color: hasLiked ? '#ff4b4b' : 'inherit', transition: 'color 0.2s' }}>
                                                            {hasLiked ? '❤️' : '🤍'}
                                                        </span> 
                                                        <span className="like-count">
                                                            {post.likes?.[0]?.count || 0}
                                                        </span>
                                                    </div>
                                                    
                                                    <div 
                                                        className="interaction-item" 
                                                        onClick={() => setActiveCommentPost(post)} 
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span>💬</span> {post.comments?.[0]?.count || 0}
                                                    </div>

                                                    {isMyPost ? (
                                                        <div 
                                                            className="interaction-item delete-trigger action-right" 
                                                            style={{ cursor: 'pointer', color: '#dc2626' }}
                                                            onClick={async () => {
                                                                if (confirm('Are you sure you want to delete this post?')) {
                                                                    setResults(prev => ({
                                                                        ...prev,
                                                                        posts: prev.posts.filter(p => p.id !== post.id)
                                                                    }));
                                                                    await fetch(`/api/delete_post?id=${post.id}`, { method: 'DELETE' });
                                                                }
                                                            }}
                                                        >
                                                            <span>🗑️</span>
                                                        </div>
                                                    ) : (
                                                        /* Render the flag icon for other people's posts matching PostFeed */
                                                        <div 
                                                            className="interaction-item report-trigger action-right" 
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => alert('Post reported successfully.')}
                                                        >
                                                            <span>⚠️</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}

                                    {/* Limit Footer */}
                                    {results.posts.length >= 10 && (
                                        <div className="limit-footer">
                                            <p>Showing the top 10 results. Try a more specific search to find more.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="no-results-text">No posts found containing "{query}".</p>
                            )
                        )}
                    </div>
                </section>
            </div>

            {/* Discussion Tree Render Modal Container */}
            {activeCommentPost && (
                <CommentsModal 
                    post={results.posts.find(p => p.id === activeCommentPost.id) || activeCommentPost}
                    currentUserId={backendUser?.id}
                    onClose={() => setActiveCommentPost(null)}
                    onLike={handleSearchPostLike}
                    onDeletePost={null} 
                />
            )}
        </div>
    );
}