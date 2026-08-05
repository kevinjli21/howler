'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getAvatarUrl } from '@/utils/helpers';

export default function MessagesPanel({ currentUserId, initialConvo = null }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(initialConvo);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [readTimes, setReadTimes] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [, setClockTick] = useState(0);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keeps relative timestamps ("5m", "1h") fresh in the conversation list
  // even when no new messages arrive to trigger a re-render.
  useEffect(() => {
    const interval = setInterval(() => setClockTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dm_last_read_')) {
        stored[key.replace('dm_last_read_', '')] = localStorage.getItem(key);
      }
    }
    setReadTimes(stored);
  }, []);

  const isUnread = (convo) => {
    if (!convo.last_message) return false;
    if (convo.last_message.sender_id === currentUserId) return false;
    const lastRead = readTimes[convo.id];
    if (!lastRead) return true;
    return new Date(convo.last_message_at) > new Date(lastRead);
  };

  const selectConvo = (convo) => {
    const now = new Date().toISOString();
    localStorage.setItem(`dm_last_read_${convo.id}`, now);
    setReadTimes(prev => ({ ...prev, [convo.id]: now }));
    window.dispatchEvent(new CustomEvent('dm-read-update'));
    setSelectedConvo(convo);
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConvo) return;

    fetch(`/api/messages?conversation_id=${selectedConvo.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .catch(console.error);

    const channel = supabase
      .channel(`dm-${selectedConvo.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${selectedConvo.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo?.id, supabase, fetchConversations]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.profiles || []).filter(u => u.id !== currentUserId));
        }
      } catch (err) { console.error('Search failed:', err); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const startNewDM = async (otherUser) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: otherUser.id }),
      });
      if (res.ok) {
        const { conversation_id } = await res.json();
        setSelectedConvo({ id: conversation_id, other_user: otherUser });
        setShowNewDM(false);
        setSearchQuery('');
        fetchConversations();
      }
    } catch (err) { console.error('Failed to start DM:', err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const optimistic = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConvo.id,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConvo.id, content }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
        fetchConversations();
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  const deleteConversation = async (convo) => {
    if (!convo || deleting) return;
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/conversations?conversation_id=${convo.id}`, { method: 'DELETE' });
      if (res.ok) {
        localStorage.removeItem(`dm_last_read_${convo.id}`);
        setConversations(prev => prev.filter(c => c.id !== convo.id));
        setSelectedConvo(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage(e);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatRelativeTime = (ts) => {
    const diffSec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diffSec < 60) return 'now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (selectedConvo) {
    return (
      <div className="dm-panel-chat">
        <div className="dm-chat-header">
          <button className="dm-back-btn" onClick={() => setSelectedConvo(null)}>←</button>
          <img
            src={getAvatarUrl(selectedConvo.other_user?.avatar_url)}
            alt="avatar"
            className="dm-other-avatar"
          />
          <div className="dm-other-info">
            <span className="dm-other-name">{selectedConvo.other_user?.full_name}</span>
            <span className="dm-other-handle">@{selectedConvo.other_user?.username}</span>
          </div>
          <button
            className="dm-delete-btn"
            onClick={() => deleteConversation(selectedConvo)}
            disabled={deleting}
            title="Delete conversation"
          >
            🗑️
          </button>
        </div>

        <div className="dm-messages-list">
          {messages.map((msg, idx) => {
            const isMine = msg.sender_id === currentUserId;
            const prevMsg = messages[idx - 1];
            const showDate = !prevMsg ||
              new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
            return (
              <div key={msg.id}>
                {showDate && <div className="dm-date-divider">{formatDate(msg.created_at)}</div>}
                <div className={`dm-message-row ${isMine ? 'dm-message-mine' : 'dm-message-theirs'}`}>
                  <div className={`dm-message-bubble ${isMine ? 'dm-bubble-mine' : 'dm-bubble-theirs'}`}>
                    <p className="dm-message-text">{msg.content}</p>
                    <span className="dm-message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="dm-input-form">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a message..."
            className="dm-input"
            maxLength={2000}
            disabled={sending}
            autoFocus
          />
          <button type="submit" className="dm-send-btn" disabled={!newMessage.trim() || sending}>
            ➤
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="dm-panel">
      <div className="dm-panel-header">
        <h2 className="dm-panel-title">Messages</h2>
        <button
          className="dm-new-btn"
          onClick={() => { setShowNewDM(!showNewDM); setSearchQuery(''); setSearchResults([]); }}
          title="New message"
        >
          ✏️
        </button>
      </div>

      {showNewDM && (
        <div className="dm-new-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a user..."
            className="dm-search-input"
            autoFocus
          />
          <div className="dm-search-results">
            {searching && <p className="dm-search-status">Searching...</p>}
            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="dm-search-status">No users found</p>
            )}
            {searchResults.map(user => (
              <button key={user.id} className="dm-search-user-item" onClick={() => startNewDM(user)}>
                <img src={getAvatarUrl(user.avatar_url)} alt="avatar" className="dm-search-avatar" />
                <div>
                  <p className="dm-search-name">{user.full_name}</p>
                  <p className="dm-search-handle">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dm-conversations">
        {loading && <p className="dm-status">Loading messages...</p>}
        {!loading && conversations.length === 0 && !showNewDM && (
          <div className="dm-empty">
            <p>No messages yet.</p>
            <p>Click ✏️ to start a conversation!</p>
          </div>
        )}
        {conversations.map(convo => (
          <button key={convo.id} className={`dm-convo-item${isUnread(convo) ? ' dm-convo-unread' : ''}`} onClick={() => selectConvo(convo)}>
            <img
              src={getAvatarUrl(convo.other_user?.avatar_url)}
              alt="avatar"
              className="dm-convo-avatar"
            />
            <div className="dm-convo-info">
              <span className="dm-convo-name">{convo.other_user?.full_name}</span>
              <span className="dm-convo-handle">@{convo.other_user?.username}</span>
              {convo.last_message && (
                <span className="dm-convo-preview">
                  {convo.last_message.sender_id === currentUserId ? 'You: ' : ''}
                  {convo.last_message.content.length > 45
                    ? convo.last_message.content.slice(0, 45) + '…'
                    : convo.last_message.content}
                </span>
              )}
            </div>
            <div className="dm-convo-right">
              {convo.last_message_at && (
                <span className="dm-convo-time">{formatRelativeTime(convo.last_message_at)}</span>
              )}
              {isUnread(convo) && <span className="dm-unread-dot" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
