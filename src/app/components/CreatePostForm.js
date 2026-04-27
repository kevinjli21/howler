'use client';
import { useState, useEffect } from 'react';

export default function CreatePostForm({ onPostCreated, onCancel }) {
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); // Empty string initially
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // State for error messages

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // 1. Requirement: Require category selection
    if (!selectedCategoryId) {
      setError('Please select a category.');
      return;
    }

    // 2. Requirement: Strict file check ONLY if a file exists
    if (file && !file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    formData.append('category_id', selectedCategoryId);
    if (file) formData.append('image', file);

    const res = await fetch('/api/posts', { method: 'POST', body: formData });
    
    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.error || 'Failed to post.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onPostCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      {error && <p className="error-message">{error}</p>}

      <h2>Create a Post</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        className="post-textarea"
        maxLength={280}
        required
      />

      <div>
        <label className="file-upload-label">
          Attach Image (Optional)
          <input type="file" accept="image/*" className="hidden-input" onChange={(e) => setFile(e.target.files[0])} />
        </label>
        {file && <p className="file-name">{file.name}</p>}
      </div>

      <select 
        value={selectedCategoryId} 
        onChange={(e) => setSelectedCategoryId(e.target.value)} 
        className="category-select"
      >
        <option value="">Select a Category Tag</option> {/* Placeholder */}
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.category_name}</option>
        ))}
      </select>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">Cancel</button>
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}