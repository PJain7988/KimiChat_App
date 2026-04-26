import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import Avatar from '../ui/Avatar';
import api from '../../utils/api';
import toast from 'react-hot-toast';

 
const Icon = {
  pencil: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  filter: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  dots: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  newGroup: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  joinGroup: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  account: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  about: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

 
const FILTER_OPTS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'ai', label: 'AI Chats' },
];

 
function AboutModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 32, width: 420, maxHeight: '85vh',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        animation: 'modalIn .25s cubic-bezier(.34,1.56,.64,1)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        { }
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>About</div>
          <button onClick={onClose} style={ghostBtn}>{Icon.close}</button>
        </div>

        { }
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 140, height: 140, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(0,201,177,0.2), rgba(0,157,225,0.2))',
            border: '2px solid rgba(0,201,177,0.3)',
            borderRadius: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 72,
          }}>
            <img
              src="../images/logo.png"
              alt="KimiChat Logo"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',marginTop: '35px',
              }}
            />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            KimiChat
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Modern Messaging Platform
          </div>
        </div>

        { }
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Name
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              KimiChat App
            </div>
          </div>

          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Version
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--teal)' }}>
              1.0.0
            </div>
          </div>

          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Build Number
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              d9ee21c
            </div>
          </div>

          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Built In
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              2026
            </div>
          </div>

          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Contact Support
            </div>
            <a href="mailto:priyajain7988@gmail.com" style={{
              fontSize: 14, fontWeight: 500, color: 'var(--teal)',
              textDecoration: 'none', cursor: 'pointer', transition: 'opacity .2s',
            }}
              onMouseEnter={e => e.target.style.opacity = '0.8'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              priyajain7988@gmail.com
            </a>
          </div>

          { }
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid var(--border2)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Developer
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              Priya Jain
            </div>
          </div>
        </div>

        { }
        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--text-dim)',
          borderTop: '1px solid var(--border2)', paddingTop: 16, marginTop: 'auto',
        }}>
          <div>© 2026 KimiChat. All rights reserved.</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="#" style={{ color: 'var(--teal)', textDecoration: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.8'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >Privacy</a>
            <span style={{ color: 'var(--border2)' }}>•</span>
            <a href="#" style={{ color: 'var(--teal)', textDecoration: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.8'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >Terms</a>
          </div>
        </div>

        { }
        <button onClick={onClose} style={{
          ...primaryBtnStyle,
          width: '100%', marginTop: 20,
        }}>Close</button>
      </div>
    </div>
  );
}

 
function NewGroupModal({ onClose }) {
  const [name, setName] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [members, setMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const { fetchChats } = useChatStore();

  const searchUsers = async (val) => {
    setSearchQ(val);
    if (!val.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const r = await api.get(`/users/search?q=${val}`);
      const available = (r.data.users || []).filter(u => !members.find(m => m._id === u._id));
      setSearchResults(available);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const addMember = (user) => {
    setMembers([...members, user]);
    setSearchQ('');
    setSearchResults([]);
  };

  const removeMember = (userId) => {
    setMembers(members.filter(m => m._id !== userId));
  };

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/chats/group', {
        name: name.trim(),
        participants: members.map(m => m._id),
      });
      toast.success('Group created!');
      fetchChats();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create group');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, width: 420, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        animation: 'modalIn .25s cubic-bezier(.34,1.56,.64,1)',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Create New Group</div>
          <button onClick={onClose} style={ghostBtn}>{Icon.close}</button>
        </div>

        <label style={fieldLabel}>Group Name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Design Team"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--teal)'}
          onBlur={e => e.target.style.borderColor = 'var(--border2)'}
        />

        <label style={{ ...fieldLabel, marginTop: 16 }}>Add Members</label>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>{Icon.search}</span>
          <input
            value={searchQ}
            onChange={e => searchUsers(e.target.value)}
            placeholder="Search by name or @username"
            style={{ ...inputStyle, paddingLeft: 36 }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        { }
        {(searchLoading || searchResults.length > 0) && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border2)',
            borderRadius: 12, padding: 8, marginBottom: 12,
            maxHeight: 200, overflowY: 'auto',
          }}>
            {searchLoading && <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 12, fontSize: 13 }}>Searching…</div>}
            {!searchLoading && searchResults.length === 0 && searchQ && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 12, fontSize: 13 }}>No users found</div>
            )}
            {searchResults.map(u => (
              <div key={u._id} onClick={() => addMember(u)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 10, cursor: 'pointer', transition: 'background .15s',
                background: 'transparent',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar name={u.name} src={u.avatar} size={32} online={u.isOnline} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        { }
        {members.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>
              {members.length} member{members.length !== 1 ? 's' : ''} added
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {members.map(m => (
                <div key={m._id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,201,177,0.15)',
                  border: '1px solid rgba(0,201,177,0.3)',
                  borderRadius: 16, padding: '5px 10px 5px 8px',
                  fontSize: 12, color: 'var(--teal)',
                  fontWeight: 600,
                }}>
                  <span>{m.name}</span>
                  <button onClick={() => removeMember(m._id)} style={{
                    background: 'none', border: 'none', color: 'var(--teal)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    padding: 0, marginLeft: 4, fontSize: 14,
                  }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16 }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={create} disabled={!name.trim() || loading} style={primaryBtnStyle}>
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

 
function JoinGroupModal({ onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      toast.success('Joined group!');
      onClose();
    } catch {
      toast.error('Invalid invite code');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, width: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        animation: 'modalIn .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Join a Group</div>
          <button onClick={onClose} style={ghostBtn}>{Icon.close}</button>
        </div>
        <label style={fieldLabel}>Invite Code or Group ID</label>
        <input
          autoFocus
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && join()}
          placeholder="Paste invite link or code"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--teal)'}
          onBlur={e => e.target.style.borderColor = 'var(--border2)'}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={join} disabled={!code.trim() || loading} style={primaryBtnStyle}>
            {loading ? 'Joining…' : 'Join Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

 
function NewChatModal({ onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openChat, fetchChats } = useChatStore();
  const navigate = useNavigate();

  const handleAIChat = async () => {
    try {
      setLoading(true);
      const res = await api.post('/chats/ai');
      if (res.data.success) {
        await fetchChats();
        openChat(res.data.chat);
        onClose();
        navigate('/app/chat');  
      }
    } catch (err) {
      toast.error('Could not connect to AI');
    } finally {
      setLoading(false);
    }
  };

  const search = async (val) => {
    setQ(val);
    if (!val.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await api.get(`/users/search?q=${val}`);
      setResults(r.data.users || []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const startChat = async (userId) => {
    const chat = await openDirectChat(userId);
    if (chat) { navigate('/app/chats'); onClose(); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 24, width: 400, maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        animation: 'modalIn .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>New Conversation</div>
          <button onClick={onClose} style={ghostBtn}>{Icon.close}</button>
        </div>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>{Icon.search}</span>
          <input
            autoFocus
            value={q}
            onChange={e => search(e.target.value)}
            placeholder="Search by name or @username"
            style={{ ...inputStyle, paddingLeft: 36 }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!q.trim() && !loading && (
            <div onClick={handleAIChat} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 14, cursor: 'pointer', marginBottom: 12,
              background: 'rgba(0,201,177,0.08)', border: '1px solid rgba(0,201,177,0.15)',
              transition: 'all .2s'
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,201,177,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,201,177,0.08)'}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal)' }}>Kimi AI Assistant</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Instant help, answers, and fun ✦</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>⚡</div>
            </div>
          )}
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20, fontSize: 13 }}>Searching…</div>}
          {!loading && q && results.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20, fontSize: 13 }}>No users found for "{q}"</div>
          )}
          {results.map(u => (
            <div key={u._id} onClick={() => startChat(u._id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar name={u.name} src={u.avatar} size={38} online={u.isOnline} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

 
const ghostBtn = {
  width: 30, height: 30, borderRadius: 8,
  background: 'rgba(255,255,255,0.06)', border: 'none',
  color: 'var(--text-dim)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all .2s',
};
const fieldLabel = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-dim)', marginBottom: 8,
  textTransform: 'uppercase', letterSpacing: '.5px',
};
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1.5px solid var(--border2)', borderRadius: 12,
  padding: '11px 14px', color: 'var(--text)', fontSize: 14,
  fontFamily: 'var(--font-body)', outline: 'none', transition: 'border .2s',
};
const primaryBtnStyle = {
  flex: 1, padding: '11px 0',
  background: 'linear-gradient(90deg,var(--teal),var(--blue))',
  border: 'none', borderRadius: 12, color: '#fff',
  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', transition: 'all .2s',
};
const cancelBtnStyle = {
  flex: 1, padding: '11px 0',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border2)', borderRadius: 12,
  color: 'var(--text)', fontFamily: 'var(--font-display)',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

 
export default function ChatList({ className }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { chats, activeChat, setActiveChat, fetchMessages, unread } = useChatStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState(null);
  const [itemMenuId, setItemMenuId] = useState(null);
  const [modal, setModal] = useState(null);  
  
  const [pinnedChats, setPinnedChats] = useState(() => JSON.parse(localStorage.getItem('kc_pinned_chats') || '[]'));
  const [mutedChats, setMutedChats] = useState(() => JSON.parse(localStorage.getItem('kc_muted_chats') || '[]'));

  const menuRef = useRef(null);
  const filterRef = useRef(null);

   
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (chat) => {
    setActiveChat(chat);
    fetchMessages(chat._id);
  };

   
  const filtered = chats
    .filter(c => {
      const name = getChatDisplayName(c, user._id);
      const matchSearch = name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === 'unread') return (unread[c._id] || 0) > 0;
      if (filter === 'groups') return c.isGroup;
      if (filter === 'ai') return c.isAI;
      return true;
    })
    .sort((a, b) => {
      const aPinned = pinnedChats.includes(a._id);
      const bPinned = pinnedChats.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
       
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const togglePin = (chatId) => {
    const next = pinnedChats.includes(chatId) ? pinnedChats.filter(id => id !== chatId) : [...pinnedChats, chatId];
    setPinnedChats(next);
    localStorage.setItem('kc_pinned_chats', JSON.stringify(next));
    toast.success(pinnedChats.includes(chatId) ? 'Chat unpinned' : 'Chat pinned');
    setItemMenuId(null);
  };

  const toggleMute = (chatId) => {
    const next = mutedChats.includes(chatId) ? mutedChats.filter(id => id !== chatId) : [...mutedChats, chatId];
    setMutedChats(next);
    localStorage.setItem('kc_muted_chats', JSON.stringify(next));
    toast.success(mutedChats.includes(chatId) ? 'Notifications unmuted' : 'Notifications muted');
    setItemMenuId(null);
  };

  const deleteChatLocally = (chatId) => {
     
     
    toast.error('Chat deleted locally');
    setItemMenuId(null);
  };

  const activeFilterLabel = FILTER_OPTS.find(f => f.key === filter)?.label || 'All';

   
  const MENU_ITEMS = [
    { icon: Icon.newGroup, label: 'New Group', onClick: () => { setModal('newGroup'); setShowMenu(false); } },
    { icon: Icon.joinGroup, label: 'Join Group', onClick: () => { setModal('joinGroup'); setShowMenu(false); } },
    { divider: true },
    { icon: Icon.account, label: 'Account', onClick: () => { navigate('/app/profile'); setShowMenu(false); } },
    { icon: Icon.settings, label: 'Settings', onClick: () => { navigate('/app/profile'); setShowMenu(false); } },
    { icon: Icon.about, label: 'About', onClick: () => { setModal('about'); setShowMenu(false); } },
  ];

  return (
    <>
      { }
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes dropIn  { from{opacity:0;transform:translateY(-6px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      <div className={className} style={{
        background: 'var(--bg-card2)',
        borderRight: '1px solid var(--border2)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        height: '100%', overflow: 'hidden',
      }}>

        { }
        <div style={{
          padding: '18px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            Messages
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

            { }
            <button
              title="New Chat"
              onClick={() => setModal('newChat')}
              style={hdrBtnStyle}
              onMouseEnter={e => applyHover(e, true)}
              onMouseLeave={e => applyHover(e, false)}
            >
              {Icon.pencil}
            </button>

            { }
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                title="Filter chats"
                onClick={() => { setShowFilter(p => !p); setShowMenu(false); }}
                style={{
                  ...hdrBtnStyle,
                  background: filter !== 'all'
                    ? 'rgba(0,201,177,0.15)'
                    : 'rgba(255,255,255,0.06)',
                  color: filter !== 'all' ? 'var(--teal)' : 'var(--text-dim)',
                  border: filter !== 'all'
                    ? '1px solid rgba(0,201,177,0.3)'
                    : '1px solid transparent',
                }}
                onMouseEnter={e => applyHover(e, true)}
                onMouseLeave={e => applyHover(e, false)}
              >
                {Icon.filter}
                {filter !== 'all' && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--teal)',
                  }} />
                )}
              </button>

              { }
              {showFilter && (
                <div style={dropdownStyle}>
                  <div style={dropLabel}>Filter by</div>
                  {FILTER_OPTS.map(opt => (
                    <button key={opt.key} onClick={() => { setFilter(opt.key); setShowFilter(false); }}
                      style={{
                        ...dropItemStyle,
                        background: filter === opt.key ? 'rgba(0,201,177,0.1)' : 'transparent',
                        color: filter === opt.key ? 'var(--teal)' : 'var(--text)',
                      }}
                      onMouseEnter={e => { if (filter !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (filter !== opt.key) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{opt.label}</span>
                      {filter === opt.key && <span style={{ color: 'var(--teal)' }}>{Icon.check}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            { }
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                title="More options"
                onClick={() => { setShowMenu(p => !p); setShowFilter(false); }}
                style={{
                  ...hdrBtnStyle,
                  background: showMenu ? 'rgba(0,201,177,0.1)' : 'rgba(255,255,255,0.06)',
                  color: showMenu ? 'var(--teal)' : 'var(--text-dim)',
                }}
                onMouseEnter={e => applyHover(e, true)}
                onMouseLeave={e => applyHover(e, false)}
              >
                {Icon.dots}
              </button>

              { }
              {showMenu && (
                <div style={dropdownStyle}>
                  {MENU_ITEMS.map((item, i) =>
                    item.divider ? (
                      <div key={i} style={{ height: 1, background: 'var(--border2)', margin: '4px 0' }} />
                    ) : (
                      <button key={i} onClick={item.onClick}
                        style={dropItemStyle}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ color: 'var(--teal)', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        { }
        {filter !== 'all' && (
          <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,201,177,0.12)',
              border: '1px solid rgba(0,201,177,0.25)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 12, color: 'var(--teal)', fontWeight: 600,
            }}>
              {activeFilterLabel}
              <button onClick={() => setFilter('all')} style={{
                background: 'none', border: 'none', color: 'var(--teal)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                padding: 0, marginLeft: 2,
              }}>{Icon.close}</button>
            </div>
          </div>
        )}

        { }
        <div style={{ margin: '0 16px 12px', position: 'relative', flexShrink: 0 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-dim)', pointerEvents: 'none', display: 'flex',
          }}>{Icon.search}</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid var(--border2)', borderRadius: 12,
              padding: '10px 14px 10px 36px',
              color: 'var(--text)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-body)', transition: 'border .2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>{Icon.close}</button>
          )}
        </div>

        { }
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {search ? 'No results found' : 'No conversations yet'}
              </div>
              <div style={{ fontSize: 12 }}>
                {search ? `Nothing matched "${search}"` : 'Start a new chat using the pencil icon above'}
              </div>
            </div>
          )}

          {filtered.map(chat => {
            const name = getChatDisplayName(chat, user._id);
            const other = chat.participants?.find(p => p._id !== user._id);
            const lastMsg = chat.lastMessage;
            const count = unread[chat._id] || 0;
            const isActive = activeChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => handleSelect(chat)}
                onMouseEnter={() => setHoveredChatId(chat._id)}
                onMouseLeave={() => { setHoveredChatId(null); if(itemMenuId !== chat._id) setItemMenuId(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 10px', borderRadius: 14, cursor: 'pointer',
                  marginBottom: 2, transition: 'all .18s',
                  background: isActive ? 'var(--teal-glow)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,201,177,0.2)' : '1px solid transparent',
                  position: 'relative'
                }}
              >
                <div onClick={(e) => { e.stopPropagation(); toast.info(`Viewing ${name}'s profile`); }} style={{ transition: 'transform .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <Avatar
                    name={name}
                    src={chat.isAI ? null : (chat.isGroup ? chat.avatar : other?.avatar)}
                    size={46}
                    online={chat.isAI ? true : (chat.isGroup ? false : other?.isOnline)}
                    gradient={chat.isAI ? 'var(--teal),var(--blue)' : null}
                    emoji={chat.isAI ? '🤖' : (chat.isGroup ? '👥' : null)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontWeight: 600, fontSize: 14,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        color: 'var(--text)',
                      }}>{name}</span>
                      {pinnedChats.includes(chat._id) && <span style={{ fontSize: 10 }}>📌</span>}
                      {mutedChats.includes(chat._id) && <span style={{ fontSize: 10, opacity: 0.6 }}>🔕</span>}
                      {chat.isGroup && (
                        <span style={{
                          fontSize: 10, background: 'rgba(0,201,177,.15)', color: 'var(--teal)',
                          borderRadius: 6, padding: '1px 6px', flexShrink: 0, fontWeight: 600,
                        }}>Group</span>
                      )}
                      {chat.isAI && (
                        <span style={{
                          fontSize: 10, background: 'linear-gradient(90deg,var(--teal),var(--blue))',
                          color: '#000', borderRadius: 6, padding: '1px 6px',
                          flexShrink: 0, fontWeight: 700,
                        }}>AI</span>
                      )}
                    </div>
                    { (hoveredChatId === chat._id || itemMenuId === chat._id) ? (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemMenuId(p => p === chat._id ? null : chat._id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                        >
                          {Icon.dots}
                        </button>
                        {itemMenuId === chat._id && (
                          <div style={{ ...itemDropdownStyle }}>
                             <div onClick={(e) => { e.stopPropagation(); togglePin(chat._id); }} style={itemDropItemStyle}>
                               {pinnedChats.includes(chat._id) ? '📍 Unpin Chat' : '📌 Pin Chat'}
                             </div>
                             <div onClick={(e) => { e.stopPropagation(); toggleMute(chat._id); }} style={itemDropItemStyle}>
                               {mutedChats.includes(chat._id) ? '🔔 Unmute' : '🔕 Mute'}
                             </div>
                             <div onClick={(e) => { e.stopPropagation(); deleteChatLocally(chat._id); }} style={{ ...itemDropItemStyle, color: 'var(--red)' }}>🗑️ Delete</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 6 }}>
                        {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 12, color: count > 0 ? 'var(--text)' : 'var(--text-dim)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontWeight: count > 0 ? 500 : 400,
                    }}>
                      {lastMsg
                        ? lastMsg.type === 'image' ? '📸 Photo'
                          : lastMsg.type === 'audio' ? '🎵 Audio'
                            : lastMsg.content
                        : 'No messages yet'}
                    </span>
                    {count > 0 && (
                      <span style={{
                        background: 'var(--teal)', color: '#000',
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,201,177,0.35)',
                      }}>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      { }
      {modal === 'newChat' && <NewChatModal onClose={() => setModal(null)} />}
      {modal === 'newGroup' && <NewGroupModal onClose={() => setModal(null)} />}
      {modal === 'joinGroup' && <JoinGroupModal onClose={() => setModal(null)} />}
      {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}
    </>
  );
}

 
const dropdownStyle = {
  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
  background: 'var(--bg-card)',
  border: '1px solid var(--border2)',
  borderRadius: 14, padding: '6px',
  minWidth: 190,
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  zIndex: 200,
  animation: 'dropIn .2s cubic-bezier(.34,1.56,.64,1)',
};
const dropLabel = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
  textTransform: 'uppercase', letterSpacing: '.08em',
  padding: '4px 10px 6px',
};
const dropItemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 10, border: 'none',
  background: 'transparent', color: 'var(--text)',
  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
  cursor: 'pointer', transition: 'background .15s', textAlign: 'left',
};
const itemDropdownStyle = {
  position: 'absolute', top: '100%', right: 0, zIndex: 100,
  background: 'var(--bg-card)', border: '1px solid var(--border2)',
  borderRadius: 12, padding: 4, width: 140, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  animation: 'dropIn .15s ease-out'
};
const itemDropItemStyle = {
  padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
  transition: 'background .2s', display: 'flex', alignItems: 'center', gap: 8
};
const hdrBtnStyle = {
  width: 32, height: 32, borderRadius: 9,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid transparent',
  color: 'var(--text-dim)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all .2s', position: 'relative',
};
const applyHover = (e, on) => {
  e.currentTarget.style.background = on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)';
  e.currentTarget.style.color = on ? 'var(--text)' : 'var(--text-dim)';
};

 
function getChatDisplayName(chat, userId) {
  if (chat.isAI) return 'Kimi AI';
  if (chat.isGroup) return chat.name || 'Group';
  const other = chat.participants?.find(p => p._id !== userId);
  return other?.name || chat.name || 'Chat';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return d.toLocaleDateString();
}