import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const TABS = ['All', 'People', 'Groups', 'Communities'];

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [results, setResults] = useState({ users: [], communities: [] });
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openDirectChat } = useChatStore();
  const navigate = useNavigate();

  const doSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults({ users: [], communities: [] }); return; }
    setLoading(true);
    try {
      const [usersRes, commRes] = await Promise.all([
        api.get(`/users/search?q=${q}`),
        api.get(`/community?q=${q}`),
      ]);
      setResults({ users: usersRes.data.users || [], communities: commRes.data.communities || [] });
    } catch {}
    setLoading(false);
  };

  const findRandom = async () => {
    setLoading(true);
    try { const r = await api.get('/users/random'); setRandomUsers(r.data.users || []); } catch {}
    setLoading(false);
  };

  const sendRequest = async (userId, name) => {
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(`Friend request sent to ${name}!`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const messageUser = async (userId) => {
    const chat = await openDirectChat(userId);
    if (chat) navigate('/app/chats');
  };

  const allResults = [
    ...results.users.map(u => ({ ...u, _type: 'user' })),
    ...results.communities.map(c => ({ ...c, _type: 'community' })),
  ];
  const filtered = tab === 'All' ? allResults
    : tab === 'People' ? results.users.map(u => ({ ...u, _type: 'user' }))
    : tab === 'Communities' ? results.communities.map(c => ({ ...c, _type: 'community' }))
    : [];

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          🔍 Search KimiChat
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--text-dim)', pointerEvents: 'none' }}>🔍</span>
          <input
            value={query}
            onChange={e => doSearch(e.target.value)}
            placeholder="Search people, groups, communities, messages…"
            style={{
              width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border2)', borderRadius: 16,
              padding: '16px 16px 16px 48px', color: 'var(--text)', fontSize: 15, outline: 'none',
              fontFamily: 'var(--font-body)', transition: 'border .2s', boxShadow: 'var(--shadow-sm)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
          {loading && (
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, border: '2px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all .2s',
              background: tab === t ? 'linear-gradient(90deg,var(--teal),var(--blue))' : 'var(--bg-card)',
              color: tab === t ? '#fff' : 'var(--text-dim)',
            }}>{t}</button>
          ))}
        </div>

        {/* Search Results */}
        {query && (
          <div style={{ marginBottom: 32 }}>
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No results found</div>
                <div style={{ fontSize: 13 }}>Try a different search term</div>
              </div>
            )}
            {filtered.map((item, i) => (
              <div key={item._id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card2)', borderRadius: 16, marginBottom: 10, border: '1px solid var(--border2)', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
                {item._type === 'user' ? (
                  <>
                    <Avatar name={item.name} src={item.avatar} size={46} online={item.isOnline} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{item.username} · {item.bio || 'KimiChat user'}</div>
                      {item.kimichatId && <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>🆔 {item.kimichatId}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => messageUser(item._id)} style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(26,140,255,.15)', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💬 Message</button>
                      <button onClick={() => sendRequest(item._id, item.name)} style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{item.emoji || '🏘️'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>👥 {item.memberCount?.toLocaleString()} members</div>
                    </div>
                    <button onClick={() => api.post(`/community/${item._id}/join`).then(() => toast.success('Joined!'))}
                      style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Join</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Random Discovery */}
        <div style={{ background: 'linear-gradient(135deg,rgba(0,201,177,.08),rgba(26,140,255,.08))', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🎲</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Random User Discovery</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>Let AI automatically match you with interesting people</div>
            </div>
            <button onClick={findRandom} style={{ marginLeft: 'auto', padding: '10px 22px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              Auto-Match Me
            </button>
          </div>

          {randomUsers.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {randomUsers.map(u => (
                <div key={u._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border2)', textAlign: 'center' }}>
                  <Avatar name={u.name} src={u.avatar} size={52} style={{ margin: '0 auto 10px' }} online={u.isOnline} />
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio || `@${u.username}`}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => sendRequest(u._id, u.name)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Connect</button>
                    <button onClick={() => messageUser(u._id)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(26,140,255,.15)', border: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>💬</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
