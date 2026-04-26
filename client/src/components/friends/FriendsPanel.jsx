import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function FriendsPanel() {
  const { user } = useAuthStore();
  const { openDirectChat } = useChatStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Fetch Logic
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, rRes, randRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/users/random')
      ]);
      setFriends(fRes.data.friends || []);
      setRequests(rRes.data.requests || []);
      setRandomUsers(randRes.data.users || []);
    } catch (err) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data.users || []);
    } catch (err) {}
  };

  const sendRequest = async (userId, name) => {
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(`Request sent to ${name}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const respondRequest = async (requestId, status) => {
    try {
      await api.put(`/friends/request/${requestId}`, { status });
      toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Request declined');
      fetchAll();
    } catch (err) {}
  };

  const filteredFriends = friends.filter(f => 
    f?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header & Tabs */}
      <div className="bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] shrink-0">
        <div className="px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold font-display">Friends</h1>
          <button 
            onClick={() => setTab('add')}
            className="px-4 py-2 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white text-sm font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
          >
            + Add New
          </button>
        </div>

        <div className="px-6 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { key: 'list', label: 'Friends', count: friends.length },
            { key: 'requests', label: 'Requests', count: requests.length },
            { key: 'random', label: '🎲 Discover', count: null },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                tab === t.key ? 'text-[var(--teal)]' : 'text-[var(--text-dim)] hover:text-white'
              }`}
            >
              {t.label}
              {t.count > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[var(--teal)] text-black text-[10px] rounded-full">{t.count}</span>}
              {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--teal)] rounded-full shadow-[0_0_8px_var(--teal)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Bar */}
        {(tab === 'list' || tab === 'add') && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-lg">🔍</span>
            <input 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={tab === 'list' ? "Search friends..." : "Find new people..."}
              className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-[var(--teal)] transition-all"
            />
          </div>
        )}

        {/* Dynamic Lists */}
        <div className="space-y-2">
          {tab === 'list' && filteredFriends.map(f => (
            <div key={f._id} className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-transparent hover:border-[rgba(0,201,177,0.15)] transition-all group">
              <Avatar name={f.name} src={f.avatar} size={48} online={f.isOnline} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{f.name}</div>
                <div className="text-xs text-[var(--text-dim)]">{f.isOnline ? 'Online' : 'Offline'}</div>
              </div>
              <button 
                onClick={() => { setActiveChat(null); navigate(`/app/chats`); openDirectChat(f._id); }}
                className="p-3 bg-[rgba(0,201,177,0.1)] text-[var(--teal)] rounded-xl hover:bg-[var(--teal)] hover:text-black transition-all"
              >
                💬
              </button>
            </div>
          ))}

          {tab === 'requests' && requests.map(req => (
            <div key={req._id} className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)]">
              <Avatar name={req.sender?.name} src={req.sender?.avatar} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{req.sender?.name}</div>
                <div className="text-xs text-[var(--text-dim)]">Sent you a friend request</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respondRequest(req._id, 'accepted')} className="px-4 py-2 bg-[var(--teal)] text-black text-xs font-bold rounded-lg hover:scale-105 transition-all">Accept</button>
                <button onClick={() => respondRequest(req._id, 'declined')} className="px-4 py-2 bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] text-xs font-bold rounded-lg hover:bg-[var(--red)] hover:text-white transition-all">Decline</button>
              </div>
            </div>
          ))}

          {tab === 'random' && randomUsers.map(u => (
            <div key={u._id} className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)]">
              <Avatar name={u.name} src={u.avatar} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{u.name}</div>
                <div className="text-xs text-[var(--text-dim)]">Suggested for you</div>
              </div>
              <button onClick={() => sendRequest(u._id, u.name)} className="px-4 py-2 border border-[var(--teal)] text-[var(--teal)] text-xs font-bold rounded-lg hover:bg-[var(--teal)] hover:text-black transition-all">Add Friend</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}