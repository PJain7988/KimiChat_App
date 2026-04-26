import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Gaming', 'Art', 'Music', 'Sports'];

export default function CommunityPanel() {
  const { user } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, [category, search]);

  const fetchCommunities = async () => {
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.q = search;
      const res = await api.get('/community', { params });
      setCommunities(res.data.communities || []);
    } catch (err) {
      toast.error('Failed to load communities');
    }
  };

  return (
    <div className="flex flex-1 h-full w-full bg-[#050d1a] overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-[340px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]">
        <div className="p-6 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">Explore</h2>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[rgba(0,201,177,0.2)]"
          >
            ＋
          </button>
        </div>

        <div className="p-4 space-y-4 shrink-0">
          <div className="relative group">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-xl px-10 py-2.5 text-sm outline-none focus:border-[var(--teal)/50] transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${category === cat ? 'bg-[var(--teal)] text-black' : 'bg-[rgba(255,255,255,0.05)] text-gray-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {communities.map((c, i) => (
            <div 
              key={i}
              className="p-4 rounded-2xl border border-white/5 hover:bg-[rgba(255,255,255,0.02)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/10">
                  {c.emoji || '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--text)] truncate">{c.name}</h3>
                  <div className="text-[10px] text-[var(--teal)] font-bold uppercase tracking-widest">{c.category}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{c.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">👥 {c.memberCount || 0} Members</span>
                <button className="text-[10px] font-bold text-[var(--teal)] uppercase tracking-widest hover:underline">Join Hub ›</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Hero Area */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 bg-[#050d1a] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--teal)]/5 blur-[120px] rounded-full" />
        <div className="relative text-center space-y-6 max-w-lg">
          <div className="text-7xl mb-8 animate-bounce-slow">🌍</div>
          <h1 className="text-5xl font-black font-display text-white leading-tight">Find your place in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--teal)] to-[var(--blue)]">KimiWorld</span></h1>
          <p className="text-gray-400 text-lg leading-relaxed">Join thousands of public hubs. Connect with people who share your passions, from tech and gaming to music and art.</p>
          <button 
            onClick={() => setShowCreate(true)}
            className="px-10 py-4 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-2xl font-black text-white shadow-2xl shadow-[rgba(0,201,177,0.3)] hover:scale-105 transition-transform"
          >
            Create Your Hub 🚀
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a1628] border border-[rgba(255,255,255,0.1)] rounded-[32px] w-full max-w-[500px] p-8 space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-display">New Community</h2>
              <button onClick={() => setShowCreate(false)} className="text-2xl text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <input placeholder="Community Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[var(--teal)] transition-all" />
              <textarea placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[var(--teal)] transition-all" />
            </div>
            <button className="w-full py-4 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-2xl font-bold text-white shadow-xl shadow-[rgba(0,201,177,0.2)]">Launch Community 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}
