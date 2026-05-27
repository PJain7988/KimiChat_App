import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';


const TABS = ['All', 'People', 'Groups', 'Communities'];

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [results, setResults] = useState({ users: [], communities: [] });
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const { openDirectChat, fetchChats } = useChatStore();
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery?.trim()) {
      setResults({ users: [], communities: [] });
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      const [usersRes, communitiesRes] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`, { signal: abortControllerRef.current.signal }),
        api.get(`/community?q=${encodeURIComponent(searchQuery)}`, { signal: abortControllerRef.current.signal }),
      ]);
      setResults({
        users: Array.isArray(usersRes.data?.users) ? usersRes.data.users : [],
        communities: Array.isArray(communitiesRes.data?.communities) ? communitiesRes.data.communities : []
      });
    } catch (error) {
      if (error.name !== 'AbortError') setResults({ users: [], communities: [] });
    } finally { setLoading(false); }
  }, []);

  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);
  }, [performSearch]);

  const fetchDiscovery = useCallback(async () => {
    setRandomLoading(true);
    try {
      const [usersRes, communitiesRes] = await Promise.all([
        api.get('/users/random'),
        api.get('/community?limit=6')
      ]);
      setRandomUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setResults(prev => ({
        ...prev,
        communities: Array.isArray(communitiesRes.data?.communities) ? communitiesRes.data.communities : []
      }));
    } catch { }
    setRandomLoading(false);
  }, []);

  useEffect(() => {
    if (!query) fetchDiscovery();
  }, [fetchDiscovery, query]);

  const sendRequest = async (userId, userName) => {
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(`Friend request sent to ${userName}!`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const messageUser = async (userId) => {
    try {
      const chat = await openDirectChat(userId);
      if (chat) navigate('/app/chats');
    } catch { toast.error('Failed to open chat'); }
  };

  const joinCommunity = async (id, name) => {
    try {
      await api.post(`/community/${id}/join`);
      
      
      if (user) {
        const updatedUser = {
          ...user,
          communities: [...(user.communities || []), id]
        };
        setUser(updatedUser);
      }
      
      
      fetchChats();
      
      toast.success(`Joined ${name}! ✨`);
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Failed to join'); 
    }
  };

  const filteredResults = useMemo(() => {
    const combined = [
      ...results.users.map(u => ({ ...u, _type: 'user' })),
      ...results.communities.map(c => ({ ...c, _type: 'community' })),
    ];
    switch (activeTab) {
      case 'People': return results.users.map(u => ({ ...u, _type: 'user' }));
      case 'Groups':
      case 'Communities': return results.communities.map(c => ({ ...c, _type: 'community' }));
      default: return combined;
    }
  }, [activeTab, results]);

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>✨ Discover & Search</h1>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--text-dim)' }}>🔍</span>
          <input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Find people, communities, and vibes…"
            style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border2)', borderRadius: 16, padding: '16px 16px 16px 48px', color: 'var(--text)', fontSize: 15, outline: 'none' }} />
          {loading && <div className="spinner" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }} />}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              background: activeTab === tab ? 'linear-gradient(90deg, var(--teal), var(--blue))' : 'var(--bg-card)',
              color: activeTab === tab ? '#fff' : 'var(--text-dim)',
            }}>{tab}</button>
          ))}
        </div>

        {query ? (
          <div>
            {filteredResults.length === 0 && !loading && <EmptyState icon="🔍" title="No results" subtitle="Try something else" />}
            {filteredResults.map(item => item._type === 'user' ? (
              <SearchUserCard key={item._id} user={item} onMessage={() => messageUser(item._id)} onAddFriend={() => sendRequest(item._id, item.name)} />
            ) : (
              <SearchCommunityCard key={item._id} community={item} onJoin={() => joinCommunity(item._id, item.name)} />
            ))}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn .5s ease' }}>
            <style>{`
              @keyframes fadeIn { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
              .spinner { width: 18px; height: 18px; border: 2px solid var(--teal); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {(activeTab === 'All' || activeTab === 'People') && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Discover People 🎲</h2>
                  <button onClick={fetchDiscovery} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {randomUsers.map(u => (
                    <DiscoveryUserCard key={u._id} user={u} onAdd={() => sendRequest(u._id, u.name)} onMsg={() => messageUser(u._id)} />
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'All' || activeTab === 'Communities' || activeTab === 'Groups') && (
              <section>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Trending Communities 🔥</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.communities.slice(0, 5).map(c => (
                    <SearchCommunityCard key={c._id} community={c} onJoin={() => joinCommunity(c._id, c.name)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoveryUserCard({ user, onAdd, onMsg }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 16, border: '1px solid var(--border2)', textAlign: 'center' }}>
      <Avatar name={user.name} src={user.avatar} size={50} online={user.isOnline} style={{ margin: '0 auto 10px' }} />
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>@{user.username}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onAdd} style={{ flex: 1, padding: '7px 0', background: 'var(--teal-glow)', border: 'none', color: 'var(--teal)', fontWeight: 800, fontSize: 11, borderRadius: 8, cursor: 'pointer' }}>Connect</button>
        <button onClick={onMsg} style={{ width: 32, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer' }}>💬</button>
      </div>
    </div>
  );
}

function SearchUserCard({ user, onMessage, onAddFriend }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card2)', borderRadius: 16, marginBottom: 10, border: '1px solid var(--border2)' }}>
      <Avatar name={user.name} src={user.avatar} size={46} online={user.isOnline} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--text)' }}>{user.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>@{user.username}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onMessage} style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(26,140,255,.15)', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💬</button>
        <button onClick={onAddFriend} style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(90deg, var(--teal), var(--blue))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
      </div>
    </div>
  );
}

function SearchCommunityCard({ community, onJoin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card2)', borderRadius: 16, marginBottom: 10, border: '1px solid var(--border2)' }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, var(--teal), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{community.emoji || '🏘️'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--text)' }}>{community.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{community.description}</p>
      </div>
      <button onClick={onJoin} style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(90deg, var(--teal), var(--blue))', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Join</button>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</h2>
      <p style={{ fontSize: 13, margin: 0 }}>{subtitle}</p>
    </div>
  );
}