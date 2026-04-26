import React, { useState } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePanel() {
  const { user, logout } = useAuthStore();
  const { chats } = useChatStore();
  
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    status: user?.status || 'active',
  });

  const handleSave = async () => {
    try {
      await api.put('/users/profile', form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header / Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[#1a8cff] to-[#7c5cfc] shrink-0">
        <div className="absolute -bottom-12 left-6 md:left-10 p-1 bg-[#050d1a] rounded-3xl">
          <Avatar name={user?.name} src={user?.avatar} size={100} online={true} />
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto pt-16 px-6 md:px-10 pb-10 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-display">{user?.name}</h1>
            <p className="text-[var(--text-dim)]">@{user?.username || 'user'}</p>
          </div>
          <button 
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="px-6 py-2 bg-[rgba(0,201,177,0.1)] text-[var(--teal)] font-bold rounded-xl border border-[var(--teal)] hover:bg-[var(--teal)] hover:text-black transition-all"
          >
            {editing ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">About Me</h3>
            {editing ? (
              <textarea 
                value={form.bio}
                onChange={e => setForm({...form, bio: e.target.value})}
                className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-sm outline-none focus:border-[var(--teal)]"
                rows={3}
              />
            ) : (
              <p className="text-sm leading-relaxed">{user?.bio || 'No bio yet.'}</p>
            )}
          </div>

          <div className="p-6 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#0d1f35] rounded-xl">
                <div className="text-xl font-bold text-[var(--teal)]">{chats.length}</div>
                <div className="text-[10px] uppercase text-[var(--text-dim)]">Chats</div>
              </div>
              <div className="text-center p-3 bg-[#0d1f35] rounded-xl">
                <div className="text-xl font-bold text-[var(--blue)]">1.2k</div>
                <div className="text-[10px] uppercase text-[var(--text-dim)]">Messages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest px-2">Account Settings</h3>
          <div className="bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)] overflow-hidden">
            <SettingItem icon="🔒" title="Privacy & Security" />
            <SettingItem icon="🔔" title="Notifications" />
            <SettingItem icon="🎨" title="Chat Appearance" />
            <SettingItem icon="🌐" title="Language" />
            <button 
              onClick={logout}
              className="w-full px-6 py-4 flex items-center gap-4 text-[var(--red)] hover:bg-[rgba(255,68,68,0.05)] transition-all border-t border-[rgba(255,255,255,0.05)]"
            >
              <span>🚪</span>
              <span className="font-bold text-sm">Logout Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon, title }) {
  return (
    <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all border-b border-[rgba(255,255,255,0.05)] last:border-0 text-left">
      <div className="flex items-center gap-4">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className="text-[var(--text-dim)]">›</span>
    </button>
  );
}