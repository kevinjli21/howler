'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { getAvatarUrl } from '@/utils/helpers';

export default function CommentsModal({ post, currentUserId, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Close modal on Escape key press (matches ReportModal's behavior)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false); //  FIXED: Changed from loading(false) to setLoading(false)
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          content: newComment,
          parent_id: replyTo ? replyTo.id : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit comment');

      setComments(prev => [...prev, data]);
      setNewComment(''); // FIXED: Ensure state updates via setter function cleanly
      setReplyTo(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete comment');
    } catch (err) {
      alert(err.message);
      fetchComments();
    }
  };

  const handleReportComment = (comment) => {
    if (confirm(`Report @${comment.profiles?.username}'s comment?`)) {
      alert('Comment reported.');
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const getRepliesFor = (parentId) => comments.filter(c => c.parent_id === parentId);

  const renderCommentBlock = (comment, isReply = false) => {
    const isMyComment = comment.user_id === currentUserId;
    const itemReplies = getRepliesFor(comment.id);
    
    const commenterUsername = comment.profiles?.username || '';
    const commenterProfileLink = `/profile/${encodeURIComponent(commenterUsername)}`;

    return (
      <div key={comment.id} className={`expanded-comment-node ${isReply ? 'expanded-nested-reply' : ''}`}>
        <div className="expanded-comment-bubble-wrapper">
          {/* Automatically auto-closes modal container on navigation click triggers */}
          <Link href={commenterProfileLink} onClick={onClose}>
            <img src={getAvatarUrl(comment.profiles?.avatar_url)} alt="avatar" className="commenter-avatar" style={{ cursor: 'pointer' }} />
          </Link>
          <div className="expanded-comment-content-block">
            <div className="expanded-comment-text-bubble">
              <Link href={commenterProfileLink} onClick={onClose} style={{ textDecoration: 'none' }}>
                <span className="commenter-username" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  @{comment.profiles?.username || 'anonymous'}
                </span>
              </Link>
              <p className="commenter-text">{comment.content}</p>
            </div>
            
            <div className="expanded-comment-actions">
              <span className="comment-timestamp">
                {new Date(comment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => setReplyTo(comment)}>Reply</button>
              {isMyComment ? (
                <button className="delete-action" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
              ) : (
                <button className="report-action" onClick={() => handleReportComment(comment)}>Report</button>
              )}
            </div>
          </div>
        </div>
        {itemReplies.map(reply => renderCommentBlock(reply, true))}
      </div>
    );
  };

  const authorUsername = post.profiles?.username || '';
  const authorProfileLink = `/profile?username=${encodeURIComponent(authorUsername)}`;

  return (
    <div className="expanded-modal-overlay" onClick={onClose}>
      <div
        className="expanded-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Post comments"
      >
        
        {/* LEFT COLUMN: Media & Content Focus */}
        <div className="expanded-modal-media-side">
          <button className="mobile-close-button" onClick={onClose}>&times;</button>
          
          <div className="expanded-media-header">
            <Link href={authorProfileLink} onClick={onClose}>
              <img src={getAvatarUrl(post.profiles?.avatar_url)} alt="author" className="author-avatar" style={{ cursor: 'pointer' }} />
            </Link>
            <div className="author-meta">
              <Link href={authorProfileLink} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong style={{ cursor: 'pointer' }}>{post.profiles?.full_name}</strong>
              </Link>
              <Link href={authorProfileLink} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ cursor: 'pointer', color: '#64748b' }}>@{post.profiles?.username}</span>
              </Link>
              {post.profiles?.campus?.name && (
                <span className="post-campus-badge">{post.profiles.campus.name}</span>
              )}
            </div>
            {post.categories?.category_name && (
              <span 
                className="expanded-category-badge" 
                style={{ backgroundColor: post.categories.color || '#4b5563' }}
              >
                {post.categories.category_name}
              </span>
            )}
          </div>

          <div className="expanded-media-scroll-content">
            <p className="expanded-post-body-text">{post.content}</p>
            
            {post.image_url && (
              <div className="expanded-image-viewport">
                <img src={post.image_url} alt="Post content focused view" />
              </div>
            )}
          </div>
          
          <div className="expanded-media-footer">
            <small>Posted on {new Date(post.posted_at).toLocaleString()}</small>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Discussion Feed */}
        <div className="expanded-modal-comments-side">
          <div className="desktop-comments-header">
            <h3>Discussion Threads</h3>
            <button className="desktop-close-button" onClick={onClose}>&times;</button>
          </div>

          {error && <div className="expanded-error-banner">{error}</div>}

          <div className="expanded-comments-timeline">
            {loading ? (
              <div className="comments-loading-placeholder">Loading conversation tree...</div>
            ) : rootComments.length === 0 ? (
              <div className="comments-empty-placeholder">No comments yet. Be the first to howl back!</div>
            ) : (
              rootComments.map(root => renderCommentBlock(root))
            )}
          </div>

          {/* Persistent Footer Input Dock */}
          <div className="expanded-comments-footer-dock">
            <form onSubmit={handleSubmitComment}>
              {replyTo && (
                <div className="expanded-reply-indicator">
                  <span>Replying to @{replyTo.profiles?.username}</span>
                  <button type="button" onClick={() => setReplyTo(null)}>&times;</button>
                </div>
              )}
              <div className="expanded-input-bar-layout">
                <input 
                  type="text" 
                  placeholder={replyTo ? `Reply to @${replyTo.profiles?.username}...` : "Add to the discussion..."}
                  value={newComment}
                  maxLength={280}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()}>Send</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}