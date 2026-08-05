'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link'; // Imported for path routing
import CategoryFilter from './CategoryFilter';
import { getAvatarUrl } from '@/utils/helpers';
import ReportModal from './ReportModal';
import CommentsModal from './CommentsModal';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from './AuthContext';

const LIMIT = 10;

// Makes a non-<button> control (a plain div) operable via keyboard —
// Enter/Space triggers the same action a mouse click would.
const onInteractionKeyDown = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler();
  }
};

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [reportingPost, setReportingPost] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? null;
  const supabaseRef = useRef(createClient());

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setPosts([]); 
    setPage(1); 
    setHasMore(true); 
  };

  const fetchPosts = async (pageNum, catId) => {
    setLoading(true);
    try {
      const url = `/api/posts?page=${pageNum}${catId ? `&categoryId=${catId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data);
        setHasMore(false);
        return;
      }
      
      if (data.length < LIMIT) {
        setHasMore(false);
      }
      
      setPosts(prev => {
        const combined = pageNum === 1 ? data : [...prev, ...data];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
    const newCount = isCurrentlyLiked 
      ? Math.max(0, (post.likes?.[0]?.count || 0) - 1) 
      : (post.likes?.[0]?.count || 0) + 1;

    setPosts(prev => prev.map(p => 
      p.id === post.id 
        ? { 
            ...p, 
            likes: [{ count: newCount }], 
            user_has_liked: isCurrentlyLiked ? [] : [{ user_id: 'temp' }] 
          } 
        : p
    ));

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id })
      });
      
      if (!res.ok) throw new Error('Failed to sync like');
    } catch (error) {
      console.error(error);
      fetchPosts(page, selectedCategory); 
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setPosts(prev => prev.filter(post => post.id !== postId));

    try {
      const res = await fetch(`/api/delete_post?id=${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');
    } catch (error) {
      console.error(error);
      alert('Could not delete post. Please try again.');
      fetchPosts(page, selectedCategory); 
    }
  };

  useEffect(() => {
    fetchPosts(page, selectedCategory);
  }, [page, selectedCategory]);

  // Live-append posts other users create, so the feed matches the "live
  // updates" behavior the rest of the app already has for DMs (MessagesPanel).
  // The realtime payload only carries the raw `posts` row (no joined
  // profile/category/count data), so we re-fetch page 1 and pull the
  // matching post out of that response instead of rendering the raw row.
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (selectedCategory && payload.new.category_id !== selectedCategory) return;
        if (payload.new.user_id === currentUserId) return; // already shown optimistically via onPostCreated's refetch

        try {
          const url = `/api/posts?page=1${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`;
          const res = await fetch(url);
          const data = await res.json();
          const newPost = Array.isArray(data) ? data.find(p => p.id === payload.new.id) : null;

          if (newPost) {
            setPosts(prev => prev.find(p => p.id === newPost.id) ? prev : [newPost, ...prev]);
          }
        } catch (err) {
          console.error('Failed to hydrate realtime post:', err);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedCategory, currentUserId]);

  return (
    <div className="feed-container">
      <CategoryFilter onSelect={handleCategorySelect} />
      
      <section className="feed-container">
        {!loading && posts.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts found in this category yet.</p>
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
            const isMyPost = post.user_id === currentUserId;

            // Determine route based on if the post matches logged in context
            const profileLink = isMyPost 
              ? '/my-profile' 
              : `/profile/${post.profiles?.username}`;

            return (
              <article key={post.id} className="post-card">
                {post.categories?.category_name && (
                  <span 
                    className="category-badge"
                    style={{ 
                      backgroundColor: post.categories.color,
                      color: '#ffffff',
                    }}
                  >
                    {post.categories.category_name}
                  </span>
                )}
                
                <div className="post-header">
                  {post.profiles?.avatar_url && (
                    <Link href={profileLink}>
                      <img 
                        src={getAvatarUrl(post.profiles.avatar_url)} 
                        alt={post.profiles.full_name || 'User avatar'} 
                        className="avatar-img"
                        style={{ cursor: 'pointer' }}
                      />
                    </Link>
                  )}
                  <h3 className="post-author">
                    <Link href={profileLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontWeight: 'bold' }}>{post.profiles?.full_name || 'Anonymous'}</span>
                    </Link>
                    {post.profiles?.username && (
                      <Link href={profileLink} style={{ textDecoration: 'none' }}>
                        <span className="post-username"> @{post.profiles.username}</span>
                      </Link>
                    )}
                    {post.profiles?.campus?.name && (
                      <span className="post-campus-badge">{post.profiles.campus.name}</span>
                    )}
                  </h3>
                </div>

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
                
                <div className="post-interactions">
                  <div
                    className="interaction-item"
                    onClick={() => handleLike(post)}
                    onKeyDown={onInteractionKeyDown(() => handleLike(post))}
                    role="button"
                    tabIndex={0}
                    aria-pressed={hasLiked}
                    aria-label={hasLiked ? 'Unlike post' : 'Like post'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      style={{
                        color: hasLiked ? '#ff4b4b' : 'inherit',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {hasLiked ? '❤️' : '🤍'}
                    </span>
                    <span className="like-count">
                      {post.likes?.[0]?.count || 0}
                    </span>
                  </div>

                  <div
                    className="interaction-item"
                    onClick={() => setActiveCommentPost(post)}
                    onKeyDown={onInteractionKeyDown(() => setActiveCommentPost(post))}
                    role="button"
                    tabIndex={0}
                    aria-label="View comments"
                    style={{ cursor: 'pointer' }}
                  >
                    <span>💬</span> {post.comments?.[0]?.count || 0}
                  </div>

                  {isMyPost ? (
                    <div
                      className="interaction-item delete-trigger action-right"
                      onClick={() => handleDelete(post.id)}
                      onKeyDown={onInteractionKeyDown(() => handleDelete(post.id))}
                      role="button"
                      tabIndex={0}
                      title="Delete your post"
                      aria-label="Delete your post"
                      style={{ cursor: 'pointer', color: '#dc2626' }}
                    >
                      <span>🗑️</span>
                    </div>
                  ) : (
                    <div
                      className="interaction-item report-trigger action-right"
                      onClick={() => setReportingPost(post)}
                      onKeyDown={onInteractionKeyDown(() => setReportingPost(post))}
                      role="button"
                      tabIndex={0}
                      title="Report this post"
                      aria-label="Report this post"
                      style={{ cursor: 'pointer' }}
                    >
                      <span>⚠️</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}

        {activeCommentPost && (
          <CommentsModal 
            post={posts.find(p => p.id === activeCommentPost.id) || activeCommentPost}
            currentUserId={currentUserId}
            onClose={() => setActiveCommentPost(null)}
            onLike={handleLike}
            onDeletePost={handleDelete}
          />
        )}

        {reportingPost && (
          <ReportModal 
            post={reportingPost} 
            onClose={() => setReportingPost(null)} 
          />
        )}
        
        {hasMore && posts.length > 0 && (
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </section>
    </div>
  );
}