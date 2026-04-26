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
  const [activeSection, setActiveSection] = useState('profile');
  
  // RESTORING YOUR FULL DATA MODEL
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || null,
    status: user?.status || 'active',
    statusMessage: user?.statusMessage || '',
  });

  const [settingsForm, setSettingsForm] = useState({
    privacy: user?.settings?.privacy || 'public',
    notifications: user?.settings?.notifications ?? true,
    theme: user?.settings?.theme || 'dark',
    readReceipts: user?.settings?.readReceipts ?? true,
    lastSeen: user?.settings?.lastSeen || 'Everyone',
    profilePhoto: user?.settings?.profilePhoto || 'Everyone',
    accentColor: user?.settings?.accentColor || '#00c9b1',
    glassmorphism: user?.settings?.glassmorphism ?? true,
    bubbleStyle: user?.settings?.bubbleStyle || 'modern',
    fontScale: user?.settings?.fontScale || '100%',
  });

  const [devices] = useState([
    { id: 1, name: 'Windows PC', location: 'Current Session', active: true, icon: '🖥️' },
    { id: 2, name: 'iPhone 15 Pro', location: 'London, UK · 2h ago', active: false, icon: '📱' }
  ]);

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/users/profile', form);
      setUser(res.data.user);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const updateSetting = (key, val) => {
    setSettingsForm(prev => ({ ...prev, [key]: val }));
    toast.success(`${key} updated`);
  };

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header / Cover */}
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] shrink-0 shadow-lg">
        <div className="absolute -bottom-14 left-8 p-1 bg-[#050d1a] rounded-[32px] shadow-2xl">
          <Avatar name={user?.name} src={user?.avatar} size={110} online={true} />
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="pt-16 px-6 shrink-0 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          {['profile', 'settings', 'privacy', 'security'].map(s => (
            <button 
              key={s}
              onClick={() => setActiveSection(s)}
              className={`pb-4 text-sm font-bold capitalize transition-all relative whitespace-nowrap ${
                activeSection === s ? 'text-[var(--teal)]' : 'text-[var(--text-dim)] hover:text-white'
              }`}
            >
              {s}
              {activeSection === s && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--teal)] rounded-full shadow-[0_0_8px_var(--teal)]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        
        {/* SECTION: PROFILE */}
        {activeSection === 'profile' && (
          <div className="space-y-6 animate-modal-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-[var(--text-dim)] text-sm">@{user?.username}</p>
              </div>
              <button 
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                className="px-6 py-2 bg-[rgba(0,201,177,0.1)] text-[var(--teal)] font-bold rounded-xl border border-[var(--teal)] hover:bg-[var(--teal)] hover:text-black transition-all"
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="About Me">
                {editing ? (
                  <textarea 
                    value={form.bio}
                    onChange={e => setForm({...form, bio: e.target.value})}
                    className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-sm outline-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{user?.bio || 'No bio yet.'}</p>
                )}
              </Card>

              <Card title="Quick Stats">
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Chats" value={chats.length} color="var(--teal)" />
                  <StatBox label="Status" value={form.status} color="var(--green)" />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SECTION: SETTINGS (RESTORING YOUR FULL SETTINGS FORM) */}
        {activeSection === 'settings' && (
          <div className="space-y-6 animate-modal-in">
            <Card title="Application Settings">
              <Toggle label="Notifications" active={settingsForm.notifications} onToggle={() => updateSetting('notifications', !settingsForm.notifications)} />
              <Toggle label="Read Receipts" active={settingsForm.readReceipts} onToggle={() => updateSetting('readReceipts', !settingsForm.readReceipts)} />
              <Toggle label="Glassmorphism UI" active={settingsForm.glassmorphism} onToggle={() => updateSetting('glassmorphism', !settingsForm.glassmorphism)} />
            </Card>

            <Card title="Appearance">
              <Select label="Bubble Style" value={settingsForm.bubbleStyle} options={['modern', 'classic', 'minimal']} onChange={v => updateSetting('bubbleStyle', v)} />
              <Select label="Font Scale" value={settingsForm.fontScale} options={['90%', '100%', '110%']} onChange={v => updateSetting('fontScale', v)} />
            </Card>
          </div>
        )}

        {/* SECTION: PRIVACY */}
        {activeSection === 'privacy' && (
          <div className="space-y-6 animate-modal-in">
            <Card title="Privacy Control">
              <Select label="Who can see my last seen" value={settingsForm.lastSeen} options={['Everyone', 'My Friends', 'Nobody']} onChange={v => updateSetting('lastSeen', v)} />
              <Select label="Who can see my profile photo" value={settingsForm.profilePhoto} options={['Everyone', 'My Friends', 'Nobody']} onChange={v => updateSetting('profilePhoto', v)} />
              <Toggle label="Incognito Mode" active={settingsForm.privacy === 'private'} onToggle={() => updateSetting('privacy', settingsForm.privacy === 'private' ? 'public' : 'private')} />
            </Card>
          </div>
        )}

        {/* SECTION: SECURITY / DEVICES */}
        {activeSection === 'security' && (
          <div className="space-y-6 animate-modal-in">
            <Card title="Active Sessions">
              <div className="space-y-4">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center gap-4 p-4 bg-[#0d1f35] rounded-xl">
                    <span className="text-2xl">{d.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{d.name} {d.active && <span className="ml-2 text-[10px] text-[var(--green)] bg-green-500/10 px-2 py-0.5 rounded-full uppercase">Active Now</span>}</div>
                      <div className="text-[10px] text-[var(--text-dim)]">{d.location}</div>
                    </div>
                    {!d.active && <button className="text-xs text-red-500 font-bold hover:underline">Terminate</button>}
                  </div>
                ))}
              </div>
            </Card>

            <button 
              onClick={logout}
              className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
            >
              Sign Out from All Devices
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-[#0a1628] rounded-[24px] border border-[rgba(255,255,255,0.05)] p-6 space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, active, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-[var(--teal)]' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4">
      <span className="text-sm font-medium shrink-0">{label}</span>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-xs text-[var(--teal)] outline-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="text-center p-4 bg-[#0d1f35] rounded-2xl border border-[rgba(255,255,255,0.05)]">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">{label}</div>
    </div>
  );
}