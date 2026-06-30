'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import CommentsModal from '../components/CommentsModal';
import { getAvatarUrl } from '@/utils/helpers';
import ReportModal from '../components/ReportModal';
import { useAuth } from '../components/AuthContext';

function SearchContent() {
    const searchParams = useSearchParams();
    const { user: backendUser } = useAuth();
    const query = searchParams.get('q');
    const [results, setResults] = useState({ profiles: [], posts: [] });
    const [loading, setLoading] = useState(true);
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [reportingPost, setReportingPost] = useState(null);

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

    const handleSearchPostLike = async (post) => {
        if (!backendUser) return;
        const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
        const newCount = isCurrentlyLiked ? Math.max(0, (post.likes?.[0]?.count || 0) - 1) : (post.likes?.[0]?.count || 0) + 1;

        setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p =>
                p.id === post.id
                    ? { ...p, likes: [{ count: newCount }], user_has_liked: isCurrentlyLiked ? [] : [{ user_id: backendUser.id }] }
                    : p
            )
        }));

        try {
            await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id })
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className='signed-in'>
            <Sidebar user={backendUser} activeNav='home' />

            <div className='main-feed-area'>
                <div className='feed-sticky-header'>
                    <h2 className='feed-heading'>
                        {query ? `Results for "${query}"` : 'Search'}
                    </h2>
                </div>

                <div className='search-feed-content'>
                    {/* Users Section */}
                    <section className="search-results-section">
                        <h2>Users</h2>
                        <div className="search-user-list">
                            {results.profiles.length > 0 ? (
                                results.profiles.map(user => {
                                    const targetUserPath = backendUser && user.id === backendUser.id ? '/my-profile' : `/profile/${user.username}`;
                                    return (
                                        <Link href={targetUserPath} key={user.id} className="search-user-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
                                            <img src={getAvatarUrl(user.avatar_url)} alt={user.username} className="profile-avatar-large" />
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
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {loading ? <p style={{ color: '#888' }}>Loading posts...</p> : (
                                results.posts.length > 0 ? (
                                    <>
                                        {results.posts.map(post => {
                                            const hasLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
                                            const isMyPost = backendUser && post.user_id === backendUser.id;
                                            const postAuthorPath = isMyPost ? '/my-profile' : `/profile/${post.profiles?.username}`;

                                            return (
                                                <article key={post.id} className="post-card">
                                                    {post.categories?.category_name && (
                                                        <span className="category-badge" style={{ backgroundColor: post.categories.color || '#4b5563', color: '#ffffff' }}>
                                                            {post.categories.category_name}
                                                        </span>
                                                    )}
                                                    <div className="post-header">
                                                        <Link href={postAuthorPath}>
                                                            <img src={getAvatarUrl(post.profiles?.avatar_url)} alt={post.profiles?.full_name || 'User avatar'} className="avatar-img" style={{ cursor: 'pointer' }} />
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
                                                    <p>{post.content}</p>
                                                    {post.image_url && <img src={post.image_url} alt="Post attachment" className="post-image" />}
                                                    <small>{new Date(post.posted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</small>

                                                    <div className="post-interactions" style={{ marginTop: '0.75rem' }}>
                                                        <div className="interaction-item" onClick={() => handleSearchPostLike(post)} style={{ cursor: 'pointer' }}>
                                                            <span style={{ color: hasLiked ? '#ff4b4b' : 'inherit', transition: 'color 0.2s' }}>{hasLiked ? '❤️' : '🤍'}</span>
                                                            <span className="like-count">{post.likes?.[0]?.count || 0}</span>
                                                        </div>
                                                        <div className="interaction-item" onClick={() => setActiveCommentPost(post)} style={{ cursor: 'pointer' }}>
                                                            <span>💬</span> {post.comments?.[0]?.count || 0}
                                                        </div>
                                                        {isMyPost ? (
                                                            <div
                                                            className="interaction-item delete-trigger action-right"
                                                            title="Delete your post"
                                                            style={{ cursor: 'pointer', color: '#dc2626' }}
                                                            >
                                                            <span>🗑️</span>
                                                            </div>
                                                        ) : (
                                                            <div
                                                            className="interaction-item report-trigger action-right"
                                                            onClick={() => setReportingPost(post)}
                                                            title="Report this post"
                                                            style={{ cursor: 'pointer' }}
                                                            >
                                                            <span>⚠️</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                        {results.posts.length >= 10 && (
                                            <div className="limit-footer"><p style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>Showing the top 10 results.</p></div>
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

            {activeCommentPost && (
                <CommentsModal post={results.posts.find(p => p.id === activeCommentPost.id) || activeCommentPost} currentUserId={backendUser?.id} onClose={() => setActiveCommentPost(null)} onLike={handleSearchPostLike} onDeletePost={null} />
            )}

            {reportingPost && (
                <ReportModal
                post={reportingPost}
                onClose={() => setReportingPost(null)}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white' }}>Loading search results...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
