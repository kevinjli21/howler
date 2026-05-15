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
      
      // Defensive check: If data is an error object or not an array, handle it gracefully
      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data);
        setHasMore(false);
        return;
      }
      
      if (data.length < LIMIT) {
        setHasMore(false);
      }
      
      setPosts(prev => {
        // Safely build the combined array
        const combined = pageNum === 1 ? data : [...prev, ...data];
        
        // De-duplicate using a Map by item.id
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
      // Check if user_has_liked exists and has items (meaning the current user liked it)
      const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;

      const newCount = isCurrentlyLiked 
        ? Math.max(0, (post.likes?.[0]?.count || 0) - 1) 
        : (post.likes?.[0]?.count || 0) + 1;

      // Optimistic UI Update
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
          posts.map((post) => (
            <article key={post.id} className="post-card">
              { /* Display category badge */ }
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
              { /* Bottom section with timestamp and interactions */ }
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
                  {/* 1. Dynamically toggle the heart emoji and the color */}
                  <span 
                    style={{ 
                      color: Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0 ? '#ff4b4b' : 'inherit',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0 ? '❤️' : '🤍'}
                  </span> 
                  
                  {/* 2. Display the current count */}
                  <span className="like-count">
                    {post.likes?.[0]?.count || 0}
                  </span>
                </div>
                <div className="interaction-item">
                  <span>💬</span> {post.comments?.[0]?.count || 0}
                </div>
                <div 
                  className="interaction-item report-trigger" 
                  onClick={() => setReportingPost(post)}
                  title="Report this post">
                  <span>⚠️</span>
                </div>
              </div>
            </article>
          ))
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