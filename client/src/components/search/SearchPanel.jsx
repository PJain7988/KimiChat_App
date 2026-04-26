import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const TABS = ['All', 'People', 'Communities'];

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [results, setResults] = useState({ users: [], communities: [] });
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openDirectChat } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery?.trim()) {
      setResults({ users: [], communities: [] });
      return;
    }
    setLoading(true);
    try {
      const [usersRes, communitiesRes] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`),
        api.get(`/community?q=${encodeURIComponent(searchQuery)}`),
      ]);
      setResults({
        users: usersRes.data.users || [],
        communities: communitiesRes.data.communities || []
      });
    } catch (err) {}
    setLoading(false);
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    performSearch(q);
  };

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const res = await api.get('/users/random');
        setRandomUsers(res.data.users || []);
      } catch (err) {}
    };
    fetchDiscovery();
  }, []);

  const sendRequest = async (userId, name) => {
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(`Request sent to ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-[#050d1a]">
      {/* Header */}
      <div className="bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] shrink-0">
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold font-display">Global Search</h1>
        </div>
        <div className="px-6 flex gap-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === t ? 'text-[var(--teal)]' : 'text-[var(--text-dim)] hover:text-white'
              }`}
            >
              {t}
              {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--teal)] rounded-full shadow-[0_0_8px_var(--teal)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-lg">🔍</span>
          <input 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for people or communities..."
            className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[var(--teal)] transition-all"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-6">
          {(activeTab === 'All' || activeTab === 'People') && results.users.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest px-2">People Found</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.users.map(u => (
                  <div key={u._id} className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)] hover:border-[rgba(0,201,177,0.2)] transition-all">
                    <Avatar name={u.name} src={u.avatar} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{u.name}</div>
                      <div className="text-xs text-[var(--text-dim)]">@{u.username}</div>
                    </div>
                    <button 
                      onClick={() => sendRequest(u._id, u.name)}
                      className="px-4 py-2 border border-[var(--teal)] text-[var(--teal)] text-xs font-bold rounded-lg hover:bg-[var(--teal)] hover:text-black transition-all"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Users (Discovery) */}
          {!query && randomUsers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest px-2">Suggested for you</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {randomUsers.map(u => (
                  <div key={u._id} className="flex flex-col items-center p-6 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)] text-center gap-3">
                    <Avatar name={u.name} src={u.avatar} size={64} />
                    <div className="min-w-0">
                      <div className="font-bold truncate">{u.name}</div>
                      <div className="text-xs text-[var(--text-dim)] mb-4">@{u.username}</div>
                    </div>
                    <button 
                      onClick={() => sendRequest(u._id, u.name)}
                      className="w-full py-2.5 bg-[rgba(0,201,177,0.1)] text-[var(--teal)] text-xs font-bold rounded-xl hover:bg-[var(--teal)] hover:text-black transition-all"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}