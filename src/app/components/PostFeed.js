'use client';
import { useEffect, useState } from 'react';
import CategoryFilter from './CategoryFilter';
import { getAvatarUrl } from '@/utils/helpers';
import ReportModal from './ReportModal';

const LIMIT = 10;

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [reportingPost, setReportingPost] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // 1. Add state to hold the actual authenticated User UUID
  const [currentUserId, setCurrentUserId] = useState(null);

  // 2. Fetch the authenticated user's UUID on mount
  useEffect(() => {
    const fetchUserUuid = async () => {
      try {
        // Dynamically import the browser client utility to get the active session
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setCurrentUserId(user.id); // This will be the pure UUID string
        }
      } catch (err) {
        console.error("Failed to fetch user UUID on client side:", err);
      }
    };

    fetchUserUuid();
  }, []);

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
      const res = await fetch('/api/posts/like', {
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
            
            // 3. Match UUID to UUID (e.g. 'user_id' matching 'currentUserId')
            const isMyPost = post.user_id === currentUserId;

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
                    <img 
                      src={getAvatarUrl(post.profiles.avatar_url)} 
                      alt={post.profiles.full_name || 'User avatar'} 
                      className="avatar-img"
                    />
                  )}
                  <h3 className="post-author">
                    {post.profiles?.full_name || 'Anonymous'}
                    {post.profiles?.username && (
                      <span className="post-username"> @{post.profiles.username}</span>
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
                  
                  <div className="interaction-item">
                    <span>💬</span> {post.comments?.[0]?.count || 0}
                  </div>
                  
                  {isMyPost ? (
                    <div 
                      className="interaction-item delete-trigger action-right" 
                      onClick={() => handleDelete(post.id)}
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
          })
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