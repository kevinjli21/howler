'use client';
import { useState } from 'react';

export default function CreatePostForm({ onPostCreated, onCancel }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    onPostCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening at UW?"
        className="post-textarea"
        maxLength={280}
        required
      />
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}