'use client';
import { useState, useEffect } from 'react';

export default function ReportModal({ post, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!reason) {
      setError('Please select a reason for the report.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          reason: reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report.');
      }

      // Success
      alert('Report submitted successfully. Thank you for helping the UW community!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation prevents the modal from closing when clicking inside the content box */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Report Post</h2>
        <p>
          You are reporting a post by <strong>@{post.profiles?.username || 'anonymous'}</strong>. 
          Please select the reason that best describes the issue.
        </p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="report-form">
          <select 
            className="report-select" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Select a reason...</option>
            <option value="Harassment">Harassment</option>
            <option value="Spam">Spam / Scams</option>
            <option value="Inappropriate">Inappropriate Content</option>
            <option value="Hate Speech">Hate Speech</option>
            <option value="Misinformation">Misinformation</option>
            <option value="Other">Other</option>
          </select>

          <div className="report-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-report-submit" 
              disabled={loading || !reason}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}