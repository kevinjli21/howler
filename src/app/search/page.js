'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import UserDropdown from '../components/UserDropdown';
import { getAvatarUrl } from '@/utils/helpers';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const [backendUser, setBackendUser] = useState(null);
    const query = searchParams.get('q');
    const [results, setResults] = useState({ profiles: [], posts: [] });
    const [loading, setLoading] = useState(true);

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
                            results.profiles.map(user => (
                                <div key={user.id} className="search-user-card">
                                    <img 
                                        src={getAvatarUrl(user.avatar_url)} 
                                        alt={user.username} 
                                        className="profile-avatar-large" 
                                    />
                                    <div>
                                        <p className="full-name">{user.full_name}</p>
                                        <p className="username">@{user.username}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-results-text">No users found.</p>
                        )}
                    </div>
                </section>

                {/* Posts Section */}
                <section className="search-results-section">
                    <h2>Posts</h2>
                    <div className="search-post-list">
                        {loading ? <p>Loading posts...</p> : (
                            results.posts.length > 0 ? (
                                <>
                                    {results.posts.map(post => (
                                        <article key={post.id} className="post-card">
                                            {/* CATEGORY BADGE ADDED HERE */}
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

                                            <div className="post-header">
                                                <img 
                                                    src={getAvatarUrl(post.profiles?.avatar_url)} 
                                                    alt={post.profiles?.full_name} 
                                                    className="avatar-img"
                                                />
                                                <div className="post-author-details">
                                                    <strong>{post.profiles?.full_name}</strong>
                                                    <span className="post-username">@{post.profiles?.username}</span>
                                                </div>
                                            </div>

                                            <p className="post-content-text">{post.content}</p>

                                            {/* Display Post Image if it exists */}
                                            {post.image_url && (
                                                <div className="post-image-container">
                                                    {/* Changed from getAvatarUrl to direct source, matching PostFeed image rendering */}
                                                    <img 
                                                        src={post.image_url} 
                                                        alt="Post content" 
                                                        className="post-image-main"
                                                    />
                                                </div>
                                            )}

                                            <small className="post-date-stamp">
                                                {new Date(post.posted_at).toLocaleString([], { 
                                                    dateStyle: 'short', 
                                                    timeStyle: 'short' 
                                                })}
                                            </small>
                                        </article>
                                    ))}

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
        </div>
    );
}