'use client';
import { useEffect, useState } from 'react';
import CategoryFilter from './CategoryFilter';
import { getAvatarUrl } from '@/utils/helpers';

const LIMIT = 10;

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
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
                <div className="interaction-item">
                  <span>❤️</span> {post.likes?.[0]?.count || 0}
                </div>
                <div className="interaction-item">
                  <span>💬</span> {post.comments?.[0]?.count || 0}
                </div>
              </div>
            </article>
          ))
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