import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function FriendsPanel() {
  const { user } = useAuthStore();
  const { openDirectChat } = useChatStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [randomUsers, setRandomUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes, uRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/users/random')
      ]);
      setFriends(fRes.data.friends || []);
      setRequests(rRes.data.requests || []);
      setRandomUsers(uRes.data.users || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (userId) => {
    try {
      const chat = await openDirectChat(userId);
      if (chat) navigate('/app/chats');
    } catch (err) {
      toast.error('Could not open chat');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#050d1a] overflow-hidden p-4 md:p-8 space-y-6">
      {/* Header & Tabs */}
      <div className="space-y-6 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold font-display">Friends</h2>
          <div className="bg-[#0a1628] p-1 rounded-2xl flex border border-white/5">
            {['list', 'requests', 'discover'].map(t => (
              <button 
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${tab === t ? 'bg-[var(--teal)] text-black' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-md">
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for friends..."
            className="w-full bg-[#0a1628] border border-white/10 rounded-2xl px-12 py-3.5 text-sm outline-none focus:border-[var(--teal)] transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
        {loading ? (
          <div className="flex items-center justify-center h-40 opacity-30">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {tab === 'list' && friends.map(f => (
              <div key={f._id} className="bg-[#0a1628] border border-white/5 rounded-[24px] p-4 flex items-center gap-4 hover:border-[var(--teal)/30] transition-all group">
                <Avatar name={f.name} src={f.avatar} size={56} online={f.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-[var(--text)]">{f.name}</div>
                  <div className="text-xs text-gray-500">@{f.username}</div>
                </div>
                <button 
                  onClick={() => handleMessage(f._id)}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[var(--teal)] hover:text-black transition-all"
                >
                  💬
                </button>
              </div>
            ))}

            {tab === 'requests' && requests.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500">No pending requests</div>
            )}
            
            {tab === 'discover' && randomUsers.map(u => (
              <div key={u._id} className="bg-[#0a1628] border border-white/5 rounded-[24px] p-6 text-center space-y-4 hover:scale-[1.02] transition-all">
                <div className="flex justify-center"><Avatar name={u.name} src={u.avatar} size={80} /></div>
                <div>
                  <div className="font-bold text-lg">{u.name}</div>
                  <div className="text-xs text-gray-500">@{u.username}</div>
                </div>
                <button className="w-full py-3 bg-[var(--teal)] text-black rounded-xl font-bold shadow-lg shadow-[rgba(0,201,177,0.2)]">Add Friend</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}