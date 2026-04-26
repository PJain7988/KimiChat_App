import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePanel() {
  const { user, setUser, logout } = useAuthStore();
  const { chats } = useChatStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    status: user?.status || 'active'
  });

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/update/profile', form);
      if (res.data.success) {
        setUser(res.data.user);
        setEditing(false);
        toast.success('Profile updated! ✨');
      }
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const SETTINGS = [
    { icon: '🔒', label: 'Privacy & Security', desc: 'Manage your visibility' },
    { icon: '🔔', label: 'Notifications', desc: 'Sounds and alerts' },
    { icon: '🌙', label: 'Appearance', desc: 'Themes and colors' },
    { icon: '🤖', label: 'AI Settings', desc: 'Kimi AI preferences' },
    { icon: '💾', label: 'Storage & Data', desc: 'Network and cache' },
    { icon: '🚪', label: 'Sign Out', desc: 'Logout of your account', red: true, action: logout },
  ];

  return (
    <div className="w-full h-full bg-[#050d1a] overflow-y-auto no-scrollbar pb-24 md:pb-8">
      {/* Profile Header Card */}
      <div className="max-w-3xl mx-auto md:mt-8 px-4">
        <div className="bg-[#0a1628] border border-[rgba(255,255,255,0.07)] rounded-[32px] overflow-hidden shadow-2xl">
          {/* Cover Area */}
          <div className="h-40 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] relative">
             <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Profile Details Area */}
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-12 left-8 p-1 bg-[#0a1628] rounded-full ring-4 ring-[#0a1628] shadow-xl">
              <Avatar name={user?.name} src={user?.avatar} size={96} />
            </div>

            <div className="pt-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold font-display">{user?.name}</h1>
                <p className="text-[var(--teal)] font-medium text-sm">@{user?.username}</p>
              </div>
              <button 
                onClick={() => setEditing(true)}
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                ✏️ Edit Profile
              </button>
            </div>

            <div className="mt-6 text-gray-400 text-sm leading-relaxed max-w-xl">
              {user?.bio || '✨ Tell the world about yourself...'}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Friends', val: user?.friends?.length || 0, icon: '👥' },
                { label: 'Groups', val: chats.filter(c => c.isGroup).length, icon: '🏠' },
                { label: 'Points', val: '1.2k', icon: '⭐' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-[var(--teal)/30] transition-all cursor-pointer">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-lg font-bold text-[var(--teal)]">{s.val}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="mt-8 space-y-3 pb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-4 mb-4">Settings & Security</h2>
          {SETTINGS.map((s, i) => (
            <div 
              key={i} 
              onClick={s.action}
              className={`
                bg-[#0a1628] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-[var(--teal)/40]
                ${s.red ? 'hover:bg-red-500/5' : 'hover:bg-[rgba(255,255,255,0.02)]'}
              `}
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className={`font-bold text-sm ${s.red ? 'text-red-400' : 'text-gray-200'}`}>{s.label}</div>
                <div className="text-[10px] text-gray-500">{s.desc}</div>
              </div>
              <div className="text-gray-600 text-lg">›</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a1628] border border-[rgba(255,255,255,0.1)] rounded-[32px] w-full max-w-[500px] p-8 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-display">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-2xl text-gray-500">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Display Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[var(--teal)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Bio</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[var(--teal)] transition-all"
                />
              </div>
            </div>

            <button 
              onClick={saveProfile}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-2xl font-bold text-white shadow-xl shadow-[rgba(0,201,177,0.2)] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes ✨'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}