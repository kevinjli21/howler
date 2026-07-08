'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, ViewTransition } from 'react';
import Link from 'next/link';
import CommentsModal from '../../components/CommentsModal';
import Sidebar from '../../components/Sidebar';
import { getAvatarUrl } from '@/utils/helpers';
import ReportModal from '../../components/ReportModal';

export default function OtherProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [navbarUser, setNavbarUser] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);
  const [dmLoading, setDmLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);

          const profileRes = await fetch('/api/myprofile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setNavbarUser(profileData);
          }
        }
      } catch (err) {
        console.error("Auth initialization check failed", err);
      }
    };

    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (res.ok) {
          setUserProfile(data.profile);
          setUserPosts(data.posts || []);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Failed to compile user profile details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSession();
    if (username) fetchPublicProfile();
  }, [username]);

  const handleMessageUser = async () => {
    setDmLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: userProfile.id }),
      });
      if (res.ok) {
        const { conversation_id } = await res.json();
        const params = new URLSearchParams({
          convo: conversation_id,
          name: userProfile.full_name || '',
          username: userProfile.username || '',
          avatar: userProfile.avatar_url || '',
        });
        router.push(`/messages?${params}`);
      }
    } catch (err) {
      console.error('Failed to open DM:', err);
    } finally {
      setDmLoading(false);
    }
  };

  const handleOtherProfileLike = async (post) => {
    const isCurrentlyLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
    const newCount = isCurrentlyLiked
      ? Math.max(0, (post.likes?.[0]?.count || 0) - 1)
      : (post.likes?.[0]?.count || 0) + 1;

    setUserPosts(prev => prev.map(p =>
      p.id === post.id
        ? {
            ...p,
            likes: [{ count: newCount }],
            user_has_liked: isCurrentlyLiked ? [] : [{ user_id: currentUserId }]
          }
        : p
    ));

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id })
      });
      if (!res.ok) throw new Error('Like sync failed');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>Loading @{username}&apos;s profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className='signed-in' style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>User not found.</p>
      </div>
    );
  }

  return (
    <div className='signed-in'>
      <Sidebar user={navbarUser} activeNav='home' />

      <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className='main-feed-area'>
        <div className='feed-sticky-header'>
          <h2 className='feed-heading'>Profile</h2>
        </div>

        <div className="my-profile-container">
          <Link href="/" className="back-feed-link">
            ← Back to Feed
          </Link>

          <div className="profile-header">
            <img
              src={getAvatarUrl(userProfile.avatar_url)}
              alt="Avatar viewport"
              className="profile-avatar-large"
            />
            <div className="profile-meta">
              <h1>{userProfile.full_name}</h1>
              <p className="profile-handle">@{userProfile.username}</p>
              <p className="campus-label">
                📍 {userProfile.campus?.name || "No campus selected"}
              </p>
              {currentUserId && currentUserId !== userProfile.id && (
                <button
                  className="message-user-btn"
                  onClick={handleMessageUser}
                  disabled={dmLoading}
                >
                  {dmLoading ? 'Opening...' : '💬 Message'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-bio-card">
            <strong className="bio-card-title">Bio</strong>
            <p className="bio-card-text">
              {userProfile.bio || "This person hasn't written a bio yet."}
            </p>
          </div>

          <hr className="profile-divider" />

          <h3 className="section-heading">Recent Activity</h3>

          <section className="feed-container public-timeline-override">
            {userPosts.length === 0 ? (
              <div className="no-posts-message">
                <p>No posts found in this history timeline.</p>
              </div>
            ) : (
              userPosts.map((post) => {
                const hasLiked = Array.isArray(post.user_has_liked) && post.user_has_liked.length > 0;
                const isMyPost = post.user_id === currentUserId;

                const profileLink = isMyPost
                  ? '/my-profile'
                  : `/profile/${post.profiles?.username}`;

                return (
                  <article key={post.id} className="post-card">
                    {post.categories?.category_name && (
                      <span
                        className="category-badge"
                        style={{ backgroundColor: post.categories.color }}
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
                          />
                        </Link>
                      )}
                      <h3 className="post-author">
                        <Link href={profileLink} className="author-name-link">
                          <span>{post.profiles?.full_name || 'Anonymous'}</span>
                        </Link>
                        {post.profiles?.username && (
                          <Link href={profileLink} className="author-handle-link">
                            <span className="post-username"> @{post.profiles.username}</span>
                          </Link>
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
                        onClick={() => handleOtherProfileLike(post)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span style={{ color: hasLiked ? '#ff4b4b' : 'inherit', transition: 'color 0.2s ease' }}>
                          {hasLiked ? '❤️' : '🤍'}
                        </span>
                        <span className="like-count">
                          {post.likes?.[0]?.count || 0}
                        </span>
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
              })
            )}
          </section>
        </div>
      </div>
      </ViewTransition>

      {activeCommentPost && (
        <CommentsModal
          post={userPosts.find(p => p.id === activeCommentPost.id) || activeCommentPost}
          currentUserId={currentUserId}
          onClose={() => setActiveCommentPost(null)}
          onLike={handleOtherProfileLike}
          onDeletePost={null}
        />
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
