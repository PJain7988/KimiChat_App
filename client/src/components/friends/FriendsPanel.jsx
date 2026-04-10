import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function FriendsPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { openDirectChat } = useChatStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchRandom();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('friend:request', ({ from }) => {
      toast(`👥 ${from.name} sent you a friend request!`);
      fetchRequests();
    });
    socket.on('friend:accepted', ({ by }) => {
      toast.success(`🎉 ${by.name} accepted your friend request!`);
      fetchFriends();
    });
    return () => { socket.off('friend:request'); socket.off('friend:accepted'); };
  }, []);

  const fetchFriends = async () => {
    try { const r = await api.get('/friends'); setFriends(r.data.friends || []); } catch {}
  };

  const fetchRequests = async () => {
    try { const r = await api.get('/friends/requests'); setRequests(r.data.requests || []); } catch {}
  };

  const fetchRandom = async () => {
    try { const r = await api.get('/users/random'); setRandomUsers(r.data.users || []); } catch {}
  };

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try { const r = await api.get(`/users/search?q=${q}`); setSearchResults(r.data.users || []); } catch {}
  };

  const sendRequest = async (userId, name) => {
    try {
      await api.post(`/friends/request/${userId}`);
      const socket = getSocket();
      if (socket) socket.emit('friend:request', { targetUserId: userId });
      toast.success(`Request sent to ${name}!`);
      setRandomUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send request'); }
  };

  const acceptRequest = async (fromId, name) => {
    try {
      await api.post(`/friends/accept/${fromId}`);
      const socket = getSocket();
      if (socket) socket.emit('friend:accepted', { targetUserId: fromId });
      toast.success(`You are now friends with ${name}!`);
      setRequests(prev => prev.filter(r => r.from._id !== fromId));
      fetchFriends();
    } catch {}
  };

  const rejectRequest = async (fromId) => {
    try {
      await api.delete(`/friends/request/${fromId}`);
      setRequests(prev => prev.filter(r => r.from._id !== fromId));
    } catch {}
  };

  const messageUser = async (userId) => {
    const chat = await openDirectChat(userId);
    if (chat) navigate('/app/chats');
  };

  const filtered = friends.filter(f => f.name?.toLowerCase().includes(searchQ.toLowerCase()) || f.username?.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', background: 'var(--bg-card)', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Friends</div>
          <button onClick={() => setTab('add')} style={{ padding: '8px 18px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Add Friend
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { key: 'list',     label: 'Friends',  count: friends.length },
            { key: 'requests', label: 'Requests', count: requests.length },
            { key: 'random',   label: '🎲 Discover', count: null },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 20px', borderRadius: '12px 12px 0 0', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', border: 'none', transition: 'all .2s',
              background: tab === key ? 'var(--bg-dark)' : 'transparent',
              color: tab === key ? 'var(--teal)' : 'var(--text-dim)',
              borderBottom: tab === key ? '2px solid var(--teal)' : '2px solid transparent',
            }}>
              {label}{count !== null && count > 0 && <span style={{ marginLeft: 6, background: key === 'requests' ? 'var(--pink)' : 'var(--teal)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-dark)' }}>

        {/* FRIENDS LIST */}
        {tab === 'list' && (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 24px' }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>🔍</span>
              <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search friends…"
                style={{ width: '100%', background: 'var(--bg-card2)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '12px 14px 12px 40px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            {(searchQ ? filtered : friends).map(f => (
              <FriendCard key={f._id} user={f} actions={[
                { icon: '💬', label: 'Message', color: 'rgba(26,140,255,.15)', textColor: 'var(--blue)', onClick: () => messageUser(f._id) },
                { icon: '📞', label: 'Call', color: 'rgba(0,201,177,.15)', textColor: 'var(--teal)', onClick: () => onStartCall?.(f, 'audio') },
                { icon: '📹', label: 'Video', color: 'rgba(124,92,252,.15)', textColor: 'var(--purple)', onClick: () => onStartCall?.(f, 'video') },
              ]} />
            ))}
            {friends.length === 0 && <EmptyState icon="👥" title="No friends yet" sub="Discover people in the Discover tab!" />}
          </div>
        )}

        {/* REQUESTS */}
        {tab === 'requests' && (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-dim)' }}>Pending Requests ({requests.length})</div>
            {requests.map(r => (
              <FriendCard key={r.from._id} user={r.from} subtitle={`Sent ${formatAgo(r.sentAt)}`} actions={[
                { icon: '✓ Accept', label: '', color: 'rgba(0,201,177,.15)', textColor: 'var(--teal)', fontSize: 14, onClick: () => acceptRequest(r.from._id, r.from.name) },
                { icon: '✕ Reject', label: '', color: 'rgba(255,68,68,.1)', textColor: 'var(--red)', fontSize: 14, onClick: () => rejectRequest(r.from._id) },
              ]} />
            ))}
            {requests.length === 0 && <EmptyState icon="📭" title="No pending requests" sub="Share your profile link to get friend requests" />}
          </div>
        )}

        {/* RANDOM DISCOVER */}
        {tab === 'random' && (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 24px' }}>
            <div style={{ background: 'linear-gradient(135deg,rgba(0,201,177,.1),rgba(26,140,255,.1))', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎲</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Random Friend Finder</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Discover and connect with new people automatically based on your interests</div>
              <button onClick={fetchRandom} style={{ padding: '11px 28px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                🔄 Refresh Suggestions
              </button>
            </div>

            {randomUsers.map(u => (
              <FriendCard key={u._id} user={u} actions={[
                { icon: '💬', label: 'Message', color: 'rgba(26,140,255,.15)', textColor: 'var(--blue)', onClick: () => messageUser(u._id) },
                { icon: '+ Connect', label: '', color: 'linear-gradient(90deg,var(--teal),var(--blue))', textColor: '#fff', fontSize: 13, onClick: () => sendRequest(u._id, u.name) },
              ]} />
            ))}
            {randomUsers.length === 0 && <EmptyState icon="🌍" title="No suggestions right now" sub="Try refreshing for new suggestions" />}
          </div>
        )}

        {/* ADD TAB */}
        {tab === 'add' && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Find People</div>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>🔍</span>
              <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search by name, @username or KimiChat ID…"
                style={{ width: '100%', background: 'var(--bg-card2)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '14px 14px 14px 42px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>
            {searchResults.map(u => (
              <FriendCard key={u._id} user={u} actions={[
                { icon: '+ Add', label: '', color: 'linear-gradient(90deg,var(--teal),var(--blue))', textColor: '#fff', fontSize: 13, onClick: () => sendRequest(u._id, u.name) },
              ]} />
            ))}
            {searchQ && searchResults.length === 0 && <EmptyState icon="🔍" title="No users found" sub={`No results for "${searchQ}"`} />}

            {/* Share profile */}
            <div style={{ marginTop: 24, background: 'var(--bg-card2)', borderRadius: 16, padding: 20, border: '1px solid var(--border2)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Share Your Profile</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input readOnly value={`kimichat.app/u/${user?.username || 'me'}`} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-dim)', fontSize: 13, outline: 'none' }} />
                <button onClick={() => { navigator.clipboard.writeText(`kimichat.app/u/${user?.username}`); toast.success('Copied!'); }}
                  style={{ padding: '10px 16px', background: 'var(--teal)', border: 'none', borderRadius: 10, color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendCard({ user, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card2)', borderRadius: 16, marginBottom: 10, border: '1px solid var(--border2)', transition: 'border .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
      <Avatar name={user.name} src={user.avatar} size={48} online={user.isOnline} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          {subtitle || user.bio || `@${user.username}`}
        </div>
        {user.kimichatId && <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>🆔 {user.kimichatId}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.onClick} style={{
            padding: a.label !== undefined && a.icon.length > 2 ? '8px 14px' : '0',
            width: a.icon.length > 2 ? 'auto' : 36, height: 36,
            borderRadius: 10, border: 'none', background: a.color, color: a.textColor,
            fontSize: a.fontSize || 18, cursor: 'pointer', fontWeight: a.fontSize ? 600 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {a.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function formatAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
