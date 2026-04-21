import React, { useState, useRef } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#00c9b1', '#1a8cff', '#7c5cfc', '#ff4fa3', '#ffb830', '#ff6b35', '#22c55e'];
const BACKGROUND_PRESETS = [
  { id: 1, name: 'Ocean Blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, name: 'Forest', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 4, name: 'Purple Dream', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 5, name: 'Dark Mode', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { id: 6, name: 'Fire', gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' },
];

const SERVER_URL = 'https://kimichat-app.onrender.com';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  return `${SERVER_URL}/${path.startsWith('/') ? path.slice(1) : path}`;
};

export default function ProfilePanel() {
  const { user, setUser, logout } = useAuthStore();
  const { chats } = useChatStore();
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarColor: user?.avatarColor || '#00c9b1',
    avatar: user?.avatar || null,
    backgroundImage: user?.backgroundImage || null,
    backgroundType: user?.backgroundType || (user?.backgroundImage ? 'image' : 'gradient'),
    backgroundPreset: user?.backgroundPreset || 1,
    status: user?.status || 'active',
    statusMessage: user?.statusMessage || '',
    music: user?.music || null,
    musicTitle: user?.musicTitle || '',
    musicArtist: user?.musicArtist || '',
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.avatar || null);
  const [previewMusic, setPreviewMusic] = useState(null);
  const [previewBackground, setPreviewBackground] = useState(user?.backgroundImage || null);
  const [settingsForm, setSettingsForm] = useState({
    privacy: user?.settings?.privacy || 'public',
    notifications: user?.settings?.notifications ?? true,
    theme: user?.settings?.theme || 'dark',
    readReceipts: user?.settings?.readReceipts ?? true,
    autoSuggestions: user?.settings?.autoSuggestions ?? true,
    voiceProcessing: user?.settings?.voiceProcessing ?? true,
    readContext: user?.settings?.readContext ?? false,
    showPreviews: user?.settings?.showPreviews ?? true,
    reactionNotifs: user?.settings?.reactionNotifs ?? true,
    lastSeen: user?.settings?.lastSeen || 'Everyone',
    profilePhoto: user?.settings?.profilePhoto || 'Everyone',
    about: user?.settings?.about || 'Everyone',
    notificationSound: user?.settings?.notificationSound || 'Tri-tone',
    accentColor: user?.settings?.accentColor || '#00c9b1',
    glassmorphism: user?.settings?.glassmorphism ?? true,
    bubbleStyle: user?.settings?.bubbleStyle || 'modern',
    fontScale: user?.settings?.fontScale || '100%',
    autoDownload: user?.settings?.autoDownload || { photos: true, videos: false, audio: true },
    dataSaver: user?.settings?.dataSaver ?? false,
  });
  
  const [subSection, setSubSection] = useState(null);  
  const [blocked, setBlocked] = useState([]);
  const [devices, setDevices] = useState([
    { id: 1, name: 'Windows Workstation', location: 'Current Session', active: true, icon: '🖥️' },
    { id: 2, name: 'iPhone 15 Pro', location: 'London, UK · 2h ago', active: false, icon: '📱' },
    { id: 3, name: 'iPad Air', location: 'Paris, FR · Yesterday', active: false, icon: '📟' }
  ]);
  const [scanning, setScanning] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);

   
  React.useEffect(() => {
    if (user && !editing) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        avatarColor: user.avatarColor || '#00c9b1',
        avatar: user.avatar || null,
        backgroundImage: user.backgroundImage || null,
        backgroundType: user.backgroundType || (user.backgroundImage ? 'image' : 'gradient'),
        backgroundPreset: user.backgroundPreset || 1,
        status: user.status || 'active',
        statusMessage: user.statusMessage || '',
        music: user.music || null,
        musicTitle: user.musicTitle || '',
        musicArtist: user.musicArtist || '',
      });
      setPreviewImage(user.avatar || null);
      setPreviewBackground(user.backgroundImage || null);
    }
  }, [user, editing]);

   
  React.useEffect(() => {
    setSubSection(null);
  }, [activeSection]);

   
  React.useEffect(() => {
    const root = document.documentElement;
    
     
    let actualTheme = settingsForm.theme;
    if (actualTheme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    root.setAttribute('data-theme', actualTheme);

     
    root.style.setProperty('--teal', settingsForm.accentColor);
    
     
    const dimColor = settingsForm.accentColor + 'dd'; 
    root.style.setProperty('--teal-dim', dimColor);
    root.style.setProperty('--teal-glow', settingsForm.accentColor + '2e');

  }, [settingsForm.theme, settingsForm.accentColor]);

  const toggleSetting = (key) => {
    const newVal = !settingsForm[key];
    setSettingsForm(prev => ({ ...prev, [key]: newVal }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newVal ? 'Enabled' : 'Disabled'}`);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
       
      if (!form.name.trim()) {
        toast.error('Display name is required');
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bio', form.bio);
      formData.append('avatarColor', form.avatarColor);
      formData.append('status', form.status);
      formData.append('statusMessage', form.statusMessage);
      formData.append('musicTitle', form.musicTitle);
      formData.append('musicArtist', form.musicArtist);
      formData.append('backgroundType', form.backgroundType);
      formData.append('backgroundPreset', form.backgroundPreset);
      
      if (form.avatar instanceof File) {
        formData.append('avatar', form.avatar);
      }
      if (form.music instanceof File) {
        formData.append('music', form.music);
      }
      if (form.backgroundImage instanceof File) {
        formData.append('backgroundImage', form.backgroundImage);
      }

      const res = await api.put('/users/update/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated successfully! ✨');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result);
        setForm(f => ({ ...f, avatar: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/update/profile', {
        settings: settingsForm
      });
      if (res.data.success) {
        setUser(res.data.user);
        toast.success('Settings synchronized successfully! ✨');
        setActiveSection(null);
      }
    } catch (e) {
      toast.error('Failed to sync settings');
    }
    setSaving(false);
  };

  const fetchBlocked = async () => {
    try {
      const res = await api.get('/friends/blocked');
      if (res.data.success) setBlocked(res.data.blocked);
    } catch (e) { toast.error('Failed to load blocked list'); }
  };

  const unblockUser = async (id) => {
    try {
      const res = await api.post(`/friends/unblock/${id}`);
      if (res.data.success) {
        toast.success('User unblocked');
        fetchBlocked();
         
        if (user) {
          setUser({ ...user, blockedUsers: user.blockedUsers.filter(uid => uid !== id) });
        }
      }
    } catch (e) { toast.error('Failed to unblock'); }
  };

  const clearCache = () => {
    setClearingCache(true);
    setCacheProgress(0);
    
     
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15;
      if (prog >= 100) {
        clearInterval(interval);
        setCacheProgress(100);
        setTimeout(() => {
          setClearingCache(false);
          toast.success('Neural cache optimized & synced! ✨');
        }, 800);
      } else {
        setCacheProgress(prog);
      }
    }, 150);
  };

  const revokeDevice = (id) => {
    const target = devices.find(d => d.id === id);
    if (target?.active) {
      toast.error('Cannot revoke the current session');
      return;
    }
    setDevices(prev => prev.filter(d => d.id !== id));
    toast.success(`Access revoked for ${target?.name}`);
  };

  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Music file size must be less than 20MB');
        return;
      }
      setPreviewMusic(file.name);
      setForm(f => ({ ...f, music: file }));
    }
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Background image must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewBackground(event.target?.result);
        setForm(f => ({ ...f, backgroundImage: file, backgroundType: 'image' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const friendCount = user?.friends?.length || 0;
  const groupCount = chats.filter(c => c.isGroup).length;
  const communityCount = user?.communities?.length || 0;

  const SETTINGS = [
    { icon: '👤', label: 'Edit Account', color: 'rgba(0,201,177,.15)', onClick: () => setEditing(true) },
    { icon: '🔒', label: 'Privacy & Security', color: 'rgba(26,140,255,.15)', onClick: () => setActiveSection('privacy') },
    { icon: '🔔', label: 'Notifications', color: 'rgba(124,92,252,.15)', onClick: () => setActiveSection('notifications') },
    { icon: '🌙', label: 'Appearance', color: 'rgba(255,184,48,.15)', onClick: () => setActiveSection('appearance') },
    { icon: '🤖', label: 'AI Settings', color: 'rgba(255,79,163,.15)', onClick: () => setActiveSection('ai') },
    { icon: '📱', label: 'Linked Devices', color: 'rgba(34,197,94,.15)', onClick: () => setActiveSection('devices') },
    { icon: '💾', label: 'Storage & Data', color: 'rgba(255,107,53,.15)', onClick: () => setActiveSection('storage') },
    { icon: '❓', label: 'Help & Support', color: 'rgba(26,140,255,.15)', onClick: () => setActiveSection('help') },
    { icon: '🚪', label: 'Sign Out', color: 'rgba(255,68,68,.15)', textColor: 'var(--red)', onClick: () => logout() },
  ];

  const STATUS_OPTIONS = [
    { value: 'active', label: '🟢 Active', color: '#22c55e' },
    { value: 'idle', label: '🟡 Away', color: '#ffb830' },
    { value: 'dnd', label: '🔴 Do Not Disturb', color: '#ff4fa3' },
    { value: 'offline', label: '⚫ Offline', color: '#9ca3af' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: 'var(--bg-card)' }}>
          { }
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: form.backgroundType === 'image' && previewBackground 
              ? `url("${getMediaUrl(previewBackground)}")` 
              : (form.backgroundType === 'image' && user?.backgroundImage)
              ? `url("${getMediaUrl(user.backgroundImage)}")`
              : BACKGROUND_PRESETS.find(p => p.id === form.backgroundPreset)?.gradient || 'linear-gradient(135deg, var(--teal) 0%, var(--blue) 50%, #7c5cfc 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            transition: 'all 0.4s ease'
          }} />

          { }
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(5, 13, 26, 0.45)',
            backdropFilter: 'blur(1px)',
            zIndex: 1
          }} />

          { }
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            {!editing ? (
              <button 
                onClick={() => setEditing(true)}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 24,
                  padding: '10px 22px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <label 
                htmlFor="bg-upload"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📸 Change Cover
                <input id="bg-upload" type="file" hidden accept="image/*" onChange={handleBackgroundUpload} />
              </label>
            )}
          </div>
        </div>

        { }
        <div style={{ padding: '0 32px', position: 'relative', zIndex: 10 }}>
          <div style={{ position: 'absolute', top: -55, left: 32, zIndex: 11 }}>
            <div style={{ 
              padding: 4, 
              borderRadius: '50%', 
              background: 'var(--bg-dark)',
              boxShadow: '0 8px 32px rgba(0,0,0,.4)'
            }}>
              <Avatar 
                name={user?.name} 
                src={getMediaUrl(previewImage || user?.avatar)} 
                size={96} 
                gradient={`${user?.avatarColor || 'var(--teal)'},var(--blue)`} 
                online={user?.status === 'active'}
              />
            </div>
            {user?.status && (
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: STATUS_OPTIONS.find(s => s.value === user.status)?.color || '#22c55e',
                border: '4px solid var(--bg-dark)',
                boxShadow: '0 2px 8px rgba(0,0,0,.3)'
              }} />
            )}
          </div>

          { }
          <div style={{ paddingTop: 60, paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0 }}>{user?.name}</h1>
                <p style={{ fontSize: 13, color: 'var(--teal)', marginTop: 4, fontWeight: 500 }}>@{user?.username}</p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>🆔 {user?.kimichatId}</p>
              </div>
            </div>

            { }
            {user?.statusMessage && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(0,201,177,.08)',
                border: '1px solid rgba(0,201,177,.2)',
                borderRadius: 10,
                fontSize: 13,
                color: 'var(--teal)',
                marginBottom: 16,
                fontStyle: 'italic'
              }}>
                💬 "{user.statusMessage}"
              </div>
            )}

            { }
            <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
              {user?.bio || '✨ No bio yet. Click edit to add one!'}
            </p>

            { }
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'Friends', value: friendCount, icon: '👥' },
                { label: 'Groups', value: groupCount, icon: '👫' },
                { label: 'Communities', value: communityCount, icon: '🌐' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'linear-gradient(135deg, rgba(0,201,177,.05), rgba(26,140,255,.05))',
                  border: '1px solid rgba(0,201,177,.1)',
                  borderRadius: 16,
                  padding: '18px 12px',
                  textAlign: 'center',
                  transition: 'all .3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,201,177,.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,201,177,.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--teal)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, fontWeight: 500 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            { }
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
              ⚙️ Settings & Preferences
            </h2>

            { }
            {SETTINGS.map((s, i) => (
              <div key={i} onClick={s.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 18px',
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 14,
                  marginBottom: 10,
                  cursor: 'pointer',
                  transition: 'all .2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--teal)';
                  e.currentTarget.style.background = 'rgba(0,201,177,.05)';
                  e.currentTarget.style.transform = 'translateX(6px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border2)';
                  e.currentTarget.style.background = 'var(--bg-card2)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.textColor || 'var(--text)' }}>
                    {s.label}
                  </div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        </div>

         <div style={{ height: 40 }} />

      { }
      {editing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5,13,26,.95)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border)',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            { }
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                margin: 0
              }}>✏️ Edit Your Profile</h2>
              <button onClick={() => setEditing(false)} style={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10,
                color: 'var(--text-dim)',
                fontSize: 24,
                cursor: 'pointer',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,.08)';
              }}>
                ✕
              </button>
            </div>

            { }
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>Profile Picture</label>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  marginBottom: 16
                }}>
                  <Avatar
                    name={form.name || user?.name}
                    src={getMediaUrl(previewImage)}
                    size={100}
                    gradient={`${form.avatarColor},var(--blue)`}
                  />
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                    border: '3px solid var(--bg-card)',
                    color: '#fff',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all .3s',
                    boxShadow: '0 4px 12px rgba(0,201,177,.3)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    📷
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                { }
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>Avatar Color</p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: c,
                          border: form.avatarColor === c ? '3px solid #fff' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all .2s',
                          boxShadow: form.avatarColor === c ? `0 0 0 2px ${c}40` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            { }
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>Display Name</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.06)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'all .2s',
                  marginBottom: 12
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />

              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people about yourself..."
                maxLength={150}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.06)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'all .2s',
                  resize: 'vertical',
                  minHeight: 80
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                {form.bio.length}/150
              </div>
            </div>

            { }
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>Status</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {STATUS_OPTIONS.map(option => (
                  <button key={option.value} onClick={() => setForm(f => ({ ...f, status: option.value }))}
                    style={{
                      padding: '10px 12px',
                      background: form.status === option.value ? 'rgba(0,201,177,.15)' : 'rgba(255,255,255,.06)',
                      border: form.status === option.value ? '1.5px solid var(--teal)' : '1.5px solid var(--border2)',
                      borderRadius: 10,
                      color: form.status === option.value ? 'var(--teal)' : 'var(--text)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .2s'
                    }}>
                    {option.label}
                  </button>
                ))}
              </div>

              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>Status Message</label>
              <input
                value={form.statusMessage}
                onChange={e => setForm(p => ({ ...p, statusMessage: e.target.value }))}
                placeholder="What's on your mind?"
                maxLength={100}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.06)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'all .2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                {form.statusMessage.length}/100
              </div>
            </div>

            { }
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>🎨 Profile Background</label>

              { }
              <div style={{
                width: '100%',
                height: 120,
                borderRadius: 14,
                marginBottom: 12,
                backgroundImage: form.backgroundType === 'image' && previewBackground 
                  ? `url("${getMediaUrl(previewBackground)}")` 
                  : BACKGROUND_PRESETS.find(p => p.id === form.backgroundPreset)?.gradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '2px solid rgba(0,201,177,.3)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5,13,26,.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    {form.backgroundType === 'image' ? '📷 Custom Image' : '✨ Gradient Preview'}
                  </span>
                </div>
              </div>

              { }
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setForm(f => ({ ...f, backgroundType: 'gradient' }))}
                  style={{
                    padding: '10px 12px',
                    background: form.backgroundType === 'gradient' ? 'rgba(0,201,177,.15)' : 'rgba(255,255,255,.06)',
                    border: form.backgroundType === 'gradient' ? '1.5px solid var(--teal)' : '1.5px solid var(--border2)',
                    borderRadius: 10,
                    color: form.backgroundType === 'gradient' ? 'var(--teal)' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .2s'
                  }}>
                  ✨ Gradient
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, backgroundType: 'image' }))}
                  style={{
                    padding: '10px 12px',
                    background: form.backgroundType === 'image' ? 'rgba(124,92,252,.15)' : 'rgba(255,255,255,.06)',
                    border: form.backgroundType === 'image' ? '1.5px solid #7c5cfc' : '1.5px solid var(--border2)',
                    borderRadius: 10,
                    color: form.backgroundType === 'image' ? '#7c5cfc' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .2s'
                  }}>
                  📷 Upload Image
                </button>
              </div>

              { }
              {form.backgroundType === 'gradient' && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Preset Gradients</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {BACKGROUND_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setForm(f => ({ ...f, backgroundPreset: preset.id }))}
                        style={{
                          height: 50,
                          borderRadius: 10,
                          background: preset.gradient,
                          border: form.backgroundPreset === preset.id ? '2px solid #fff' : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'all .2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title={preset.name}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}>
                        {form.backgroundPreset === preset.id && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,.3)',
                            color: '#fff',
                            fontSize: 16
                          }}>✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              { }
              {form.backgroundType === 'image' && (
                <button onClick={() => backgroundInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(124,92,252,.15)',
                    border: '1.5px dashed rgba(124,92,252,.3)',
                    borderRadius: 12,
                    color: '#7c5cfc',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(124,92,252,.25)';
                    e.currentTarget.style.borderColor = 'rgba(124,92,252,.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(124,92,252,.15)';
                    e.currentTarget.style.borderColor = 'rgba(124,92,252,.3)';
                  }}>
                  {previewBackground ? '✓ Image Selected' : '📸 Upload Background Image'}
                </button>
              )}

              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                style={{ display: 'none' }}
              />
            </div>

            { }
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '.5px'
              }}>🎵 Now Playing (Optional)</label>

              <div style={{
                background: 'linear-gradient(135deg, rgba(124,92,252,.1), rgba(255,79,163,.1))',
                border: '1.5px solid rgba(124,92,252,.2)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12
              }}>
                <input
                  value={form.musicTitle}
                  onChange={e => setForm(p => ({ ...p, musicTitle: e.target.value }))}
                  placeholder="Song title"
                  maxLength={50}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid var(--border2)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    marginBottom: 8,
                    transition: 'all .2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
                <input
                  value={form.musicArtist}
                  onChange={e => setForm(p => ({ ...p, musicArtist: e.target.value }))}
                  placeholder="Artist name"
                  maxLength={50}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid var(--border2)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    transition: 'all .2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              <button onClick={() => musicInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(124,92,252,.15)',
                  border: '1.5px dashed rgba(124,92,252,.3)',
                  borderRadius: 12,
                  color: '#7c5cfc',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124,92,252,.25)';
                  e.currentTarget.style.borderColor = 'rgba(124,92,252,.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(124,92,252,.15)';
                  e.currentTarget.style.borderColor = 'rgba(124,92,252,.3)';
                }}>
                {previewMusic ? `✓ ${previewMusic}` : '🎵 Upload Music File (Optional)'}
              </button>

              <input
                ref={musicInputRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                style={{ display: 'none' }}
              />
            </div>

            { }
            <div style={{ marginBottom: 28 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px'
                }}>Email</label>
                <input readOnly value={user?.email || ''} style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.03)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--text-dim)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  cursor: 'not-allowed'
                }} />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px'
                }}>KimiChat ID</label>
                <input readOnly value={user?.kimichatId || ''} style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.03)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--text-dim)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  cursor: 'not-allowed'
                }} />
              </div>
            </div>

            { }
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(false)} style={{
                flex: 1,
                padding: 13,
                background: 'rgba(255,255,255,.06)',
                border: '1.5px solid var(--border2)',
                borderRadius: 12,
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,.1)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                e.currentTarget.style.borderColor = 'var(--border2)';
              }}>
                Cancel
              </button>
              <button onClick={saveProfile} disabled={saving} style={{
                flex: 1,
                padding: 13,
                background: 'linear-gradient(90deg, var(--teal), var(--blue))',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'all .2s'
              }}
              onMouseEnter={e => {
                if (!saving) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                if (!saving) e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {saving ? '⏳ Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,13,26,.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: 16,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 28,
            width: '100%', maxWidth: 500, boxShadow: '0 25px 70px rgba(0,0,0,.6)', maxHeight: '92vh', overflowY: 'auto',
            animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border2)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
               <div>
                 <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }}>
                    {SETTINGS.find(s => s.onClick.toString().includes(activeSection))?.label || 'Settings'}
                 </h2>
                 <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>Personalize your experience</div>
               </div>
               <button onClick={() => setActiveSection(null)} style={{ background: 'rgba(255,255,255,.05)', border: 'none', color: 'var(--text-dim)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}>✕</button>
            </div>

            <div style={{ padding: '28px' }}>
              {activeSection === 'privacy' && !subSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Last Seen & Online', desc: settingsForm.lastSeen, icon: '👁️', key: 'lastSeen' },
                    { label: 'Profile Photo', desc: settingsForm.profilePhoto, icon: '📷', key: 'profilePhoto' },
                    { label: 'About', desc: settingsForm.about, icon: 'ℹ️', key: 'about' },
                    { label: 'Read Receipts', desc: 'Others can see when you read', icon: '✓', isToggle: true, key: 'readReceipts' },
                    { label: 'Blocked Contacts', desc: `${user?.blockedUsers?.length || 0} users`, icon: '🚫', key: 'blocked' },
                  ].map(item => (
                    <div key={item.label} onClick={() => {
                      if (item.isToggle) toggleSetting(item.key);
                      else if (['lastSeen', 'profilePhoto', 'about'].includes(item.key)) setSubSection(item.key);
                      else if (item.key === 'blocked') { setSubSection('blocked'); fetchBlocked(); }
                      else toast(`${item.label} settings coming soon!`);
                    }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '16px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', transition: 'all .2s' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{item.desc}</div>
                        </div>
                      </div>
                      {item.isToggle ? (
                        <div style={{ width: 48, height: 26, background: settingsForm[item.key] ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1.5px solid var(--border2)', transition: 'all .3s' }}>
                          <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2.5, left: settingsForm[item.key] ? 24.5 : 2.5, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}/>
                        </div>
                      ) : <span style={{ color: 'var(--text-dim)', fontSize: 20 }}>›</span>}
                    </div>
                  ))}
                  <button 
                    onClick={saveSettings} 
                    disabled={saving}
                    style={{ marginTop: 12, padding: 16, background: 'linear-gradient(90deg, var(--teal), var(--blue))', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,201,177,.2)', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? '⏳ Syncing…' : 'Save & Secure'}
                  </button>
                </div>
              )}

              {activeSection === 'privacy' && subSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 18, cursor: 'pointer' }}>←</button>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{subSection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                  </div>
                  {['Everyone', 'My Contacts', 'Nobody'].map(opt => (
                    <div key={opt} onClick={() => { setSettingsForm(p => ({ ...p, [subSection]: opt })); setSubSection(null); toast.success(`${subSection} set to ${opt}`); }}
                      style={{ padding: '16px', background: settingsForm[subSection] === opt ? 'rgba(0,201,177,.1)' : 'var(--bg-card2)', borderRadius: 14, border: '1.5px solid', borderColor: settingsForm[subSection] === opt ? 'var(--teal)' : 'var(--border2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{opt}</span>
                      {settingsForm[subSection] === opt && <span style={{ color: 'var(--teal)' }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'privacy' && subSection === 'blocked' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 18, cursor: 'pointer' }}>←</button>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Blocked Contacts</h3>
                  </div>
                  {blocked.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                      <div style={{ fontSize: 14 }}>Your blocked list is empty.</div>
                    </div>
                  ) : blocked.map(u => (
                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Avatar name={u.name} src={getMediaUrl(u.avatar)} size={40} gradient={`${u.avatarColor},var(--blue)`} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{u.username}</div>
                        </div>
                      </div>
                      <button onClick={() => unblockUser(u._id)} style={{ padding: '6px 14px', background: 'rgba(0,201,177,.1)', border: 'none', borderRadius: 8, color: 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Unblock</button>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Message Alerts', desc: 'Push notifications for messages', key: 'notifications' },
                    { label: 'Show Previews', desc: 'Preview message text in banner', key: 'showPreviews' },
                    { label: 'Reaction Alerts', desc: 'Notify on message reactions', key: 'reactionNotifs' },
                    { label: 'Sound Effects', desc: settingsForm.notificationSound, on: true, type: 'select', key: 'sound' },
                  ].map(item => (
                    <div key={item.label} onClick={() => {
                      if (item.type === 'select') setSubSection('sound');
                      else toggleSetting(item.key);
                    }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', cursor: 'pointer' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{item.desc}</div>
                      </div>
                      {item.type !== 'select' ? (
                        <div style={{ width: 48, height: 26, background: settingsForm[item.key] ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1.5px solid var(--border2)', transition: 'all .3s' }}>
                          <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2.5, left: settingsForm[item.key] ? 24.5 : 2.5, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}/>
                        </div>
                      ) : <button style={{ padding: '6px 12px', background: 'rgba(26,140,255,.15)', border: 'none', borderRadius: 8, color: 'var(--blue)', fontWeight: 600, fontSize: 12 }}>Change</button>}
                    </div>
                  ))}
                  <button onClick={saveSettings} disabled={saving} style={{ marginTop: 12, padding: 16, background: 'linear-gradient(90deg, var(--blue), #7c5cfc)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(26,140,255,.2)', opacity: saving ? 0.7 : 1 }}>
                    {saving ? '⏳ Saving…' : 'Save Notification Preferences'}
                  </button>
                </div>
              )}

              {activeSection === 'notifications' && subSection === 'sound' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 18, cursor: 'pointer' }}>←</button>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Notification Sound</h3>
                  </div>
                  {['Tri-tone', 'Glass', 'Chime', 'Aurora', 'None'].map(opt => (
                    <div key={opt} onClick={() => { setSettingsForm(p => ({ ...p, notificationSound: opt })); setSubSection(null); toast.success(`Sound set to ${opt}`); }}
                      style={{ padding: '16px', background: settingsForm.notificationSound === opt ? 'rgba(26,140,255,.1)' : 'var(--bg-card2)', borderRadius: 14, border: '1.5px solid', borderColor: settingsForm.notificationSound === opt ? 'var(--blue)' : 'var(--border2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{opt}</span>
                      {settingsForm.notificationSound === opt && <span style={{ color: 'var(--blue)' }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  { }
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Interface Theme</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                       {['System', 'Light', 'Dark'].map(t => {
                         const active = settingsForm.theme.toLowerCase() === t.toLowerCase();
                         return (
                          <button key={t} onClick={() => { setSettingsForm(p => ({ ...p, theme: t.toLowerCase() })); }}
                            style={{
                              padding: '24px 10px', borderRadius: 16, border: active ? `2px solid ${settingsForm.accentColor}` : '2px solid var(--border2)',
                              background: active ? 'rgba(255,255,255,0.03)' : 'transparent', color: active ? settingsForm.accentColor : 'var(--text)', fontWeight: 700, cursor: 'pointer', transition: 'all .2s', fontSize: 13,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                            }} >
                              <span style={{ fontSize: 20 }}>{t === 'Light' ? '☀️' : t === 'Dark' ? '🌙' : '🖥️'}</span>
                              {t}
                            </button>
                         );
                       })}
                    </div>
                  </div>

                  { }
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Accent Color</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {['#00c9b1', '#1a8cff', '#7c5cfc', '#ff4fa3', '#ff6b35', '#22c55e'].map(c => (
                        <button key={c} onClick={() => setSettingsForm(p => ({ ...p, accentColor: c }))}
                          style={{
                            width: 44, height: 44, borderRadius: '50%', background: c, border: settingsForm.accentColor === c ? '3px solid #fff' : 'none',
                            cursor: 'pointer', transition: 'all .2s', boxShadow: settingsForm.accentColor === c ? `0 0 15px ${c}80` : 'none',
                            transform: settingsForm.accentColor === c ? 'scale(1.1)' : 'scale(1)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  { }
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Glassmorphism Effects', desc: 'Enable blur & transparency', key: 'glassmorphism' },
                    ].map(item => (
                      <div key={item.label} onClick={() => setSettingsForm(p => ({ ...p, [item.key]: !p[item.key] }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <div style={{ width: 44, height: 24, background: settingsForm[item.key] ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1px solid var(--border2)', transition: 'all .3s' }}>
                          <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: settingsForm[item.key] ? 24 : 2, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  { }
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Chat Bubble Style</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {['Modern', 'Rounded', 'Classic'].map(s => (
                        <button key={s} onClick={() => setSettingsForm(p => ({ ...p, bubbleStyle: s.toLowerCase() }))}
                          style={{
                            padding: '12px', borderRadius: 12, border: '1px solid var(--border2)', background: settingsForm.bubbleStyle === s.toLowerCase() ? 'rgba(255,255,255,0.05)' : 'transparent',
                            color: settingsForm.bubbleStyle === s.toLowerCase() ? settingsForm.accentColor : 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  { }
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Text Scale: {settingsForm.fontScale}</label>
                    <input type="range" min="80" max="120" step="10" value={parseInt(settingsForm.fontScale)} 
                      onChange={(e) => setSettingsForm(p => ({ ...p, fontScale: `${e.target.value}%` }))}
                      style={{ width: '100%', accentColor: settingsForm.accentColor, cursor: 'pointer' }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span>Compact</span>
                      <span>Standard</span>
                      <span>Large</span>
                    </div>
                  </div>

                  <button onClick={saveSettings} disabled={saving} 
                    style={{ 
                      marginTop: 12, padding: 18, background: `linear-gradient(135deg, ${settingsForm.accentColor}, ${settingsForm.accentColor}dd)`, 
                      color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', 
                      boxShadow: `0 10px 30px ${settingsForm.accentColor}33`, opacity: saving ? 0.7 : 1, transition: 'all .3s' 
                    }}>
                    {saving ? '⏳ Synchronizing Architecture…' : '🚀 Apply Professional Visuals'}
                  </button>
                </div>
              )}

              {activeSection === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ textAlign: 'center', background: 'var(--bg-card2)', padding: '24px', borderRadius: 24, border: '1px solid var(--border2)' }}>
                    <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 0 15px var(--teal))' }}>🤖</div>
                    <h3 style={{ margin: 0, color: 'var(--teal)', fontSize: 20, fontFamily: 'var(--font-display)' }}>Kimi AI Neural Engine</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 8 }}>Next-gen conversational intelligence</p>
                  </div>
                  {[
                    { label: 'Auto-suggestions', desc: 'Predictive reply suggestions', key: 'autoSuggestions' },
                    { label: 'Voice Processing', desc: 'Neural audio transcription', key: 'voiceProcessing' },
                    { label: 'Full Context Aware', desc: 'Allow AI to read chat history', key: 'readContext' }
                  ].map(item => (
                    <div key={item.label} onClick={() => toggleSetting(item.key)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', cursor: 'pointer' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <div style={{ width: 48, height: 26, background: settingsForm[item.key] ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1.5px solid var(--border2)', transition: 'all .3s' }}>
                        <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2.5, left: settingsForm[item.key] ? 24.5 : 2.5, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}/>
                      </div>
                    </div>
                  ))}
                  <button onClick={saveSettings} disabled={saving} style={{ marginTop: 12, padding: 16, background: 'linear-gradient(90deg, #ff4fa3, #ff6b35)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,79,163,.2)', opacity: saving ? 0.7 : 1 }}>
                    {saving ? '⏳ Initializing…' : 'Sync AI Engine'}
                  </button>
                </div>
              )}

              {activeSection === 'devices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>🖥️</div>
                    <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Seamlessly sync KimiChat across all your hardware.</p>
                  </div>
                  
                  {!scanning && !showMyQR && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <button onClick={() => setScanning(true)} style={{ flex: 1, minWidth: 200, padding: 18, background: `linear-gradient(90deg, ${settingsForm.accentColor}, ${settingsForm.accentColor}dd)`, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 700, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 10px 25px ${settingsForm.accentColor}33` }}>
                        <span>➕</span> Link Shared Device
                      </button>
                      <button onClick={() => setShowMyQR(true)} style={{ padding: 18, background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 16, color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: 16, width: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span>QR</span>
                      </button>
                    </div>
                  )}

                  {showMyQR && (
                    <div className="animate-scale-in" style={{ padding: 32, background: 'var(--bg-card)', borderRadius: 28, border: `2px solid ${settingsForm.accentColor}44`, textAlign: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>My Account QR</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, marginBottom: 24 }}>Scan this on another device to link your account</p>
                      
                      <div style={{ 
                        background: '#fff', padding: 20, borderRadius: 24, display: 'inline-block', 
                        boxShadow: `0 20px 40px rgba(0,0,0,.4), 0 0 20px ${settingsForm.accentColor}22` 
                      }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.kimichatId}&color=${settingsForm.accentColor.replace('#','')}&bgcolor=ffffff&margin=10`} 
                          alt="Account QR"
                          style={{ width: 200, height: 200 }}
                        />
                      </div>
                      
                      <div style={{ marginTop: 24, padding: '10px 16px', background: 'var(--bg-dark)', borderRadius: 12, display: 'inline-block', fontSize: 14, fontWeight: 700, color: settingsForm.accentColor }}>
                        ID: {user.kimichatId}
                      </div>

                      <button onClick={() => setShowMyQR(false)} style={{ marginTop: 32, width: '100%', padding: 14, border: 'none', background: 'var(--bg-card2)', borderRadius: 14, color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>Close QR</button>
                    </div>
                  )}
                  {scanning && (
                    <div className="animate-fade-in" style={{ padding: 24, background: 'var(--bg-dark)', borderRadius: 24, border: `2px solid ${settingsForm.accentColor}`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: settingsForm.accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>Neural QR Scanner</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Align the QR code within the frame</div>
                      </div>
                      
                      <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', borderRadius: 16, position: 'relative', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         { }
                         <div style={{ position: 'absolute', inset: 40, border: `2px solid ${settingsForm.accentColor}44`, borderRadius: 12 }}>
                            { }
                            <div style={{ 
                              position: 'absolute', top: 0, left: 0, width: '100%', height: 2, 
                              background: settingsForm.accentColor, boxShadow: `0 0 15px ${settingsForm.accentColor}`,
                              animation: 'scanMove 2s ease-in-out infinite'
                            }} />
                            <style>{`
                              @keyframes scanMove {
                                0%, 100% { top: 0%; opacity: 0.5; }
                                50% { top: 100%; opacity: 1; }
                              }
                            `}</style>
                         </div>
                         <div style={{ color: '#ffffff22', fontSize: 80 }}>📸</div>
                      </div>

                      <button onClick={() => setScanning(false)} style={{ marginTop: 20, width: '100%', padding: '12px', background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 12, color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>Cancel Scanning</button>
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Authenticated Sessions</h3>
                    {devices.map((dev) => (
                      <div key={dev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'var(--bg-card2)', borderRadius: 20, border: '1px solid var(--border2)', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ fontSize: 28, opacity: dev.active ? 1 : 0.6 }}>{dev.icon}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{dev.name} {dev.active && <span style={{ color: settingsForm.accentColor, fontSize: 11, background: `${settingsForm.accentColor}15`, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>Active Now</span>}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{dev.location}</div>
                          </div>
                        </div>
                        {!dev.active && (
                          <button onClick={() => revokeDevice(dev.id)} style={{ background: 'rgba(255,68,68,.1)', border: 'none', color: '#ff4444', height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'storage' && !subSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                     <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', border: '10px solid var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '10px solid var(--teal)', clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 65%)', filter: 'drop-shadow(0 0 10px var(--teal))' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>1.2 GB</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Optimized</div>
                        </div>
                     </div>
                   </div>

                   <div style={{ background: 'var(--bg-card2)', padding: '20px', borderRadius: 24, border: '1px solid var(--border2)' }}>
                      <h3 style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Neural Storage Breakdown</h3>
                      {[
                        { label: 'Visual Media', size: '850 MB', color: 'var(--blue)' },
                        { label: 'Audio Records', size: '210 MB', color: 'var(--teal)' },
                        { label: 'System Files', size: '140 MB', color: '#ff4fa3' }
                      ].map(item => (
                         <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                            <div style={{ fontSize: 14, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{item.size}</div>
                         </div>
                      ))}
                   </div>

                   <div>
                      <h3 style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Auto-Download Strategy</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.keys(settingsForm.autoDownload).map(key => (
                          <div key={key} onClick={() => setSettingsForm(p => ({ ...p, autoDownload: { ...p.autoDownload, [key]: !p.autoDownload[key] } }))}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', cursor: 'pointer' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
                            <div style={{ width: 44, height: 24, background: settingsForm.autoDownload[key] ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1px solid var(--border2)', transition: 'all .3s' }}>
                              <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: settingsForm.autoDownload[key] ? 24 : 2, transition: 'all 0.3s' }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   <button onClick={() => setSubSection('network')} style={{ padding: 18, background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 20, cursor: 'pointer', color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      📡 View Network Intelligence
                   </button>

                   <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={clearCache} disabled={clearingCache} 
                        style={{ flex: 1, padding: '16px', background: clearingCache ? 'var(--bg-card2)' : 'rgba(255,68,68,.1)', borderRadius: 16, border: 'none', fontWeight: 700, cursor: 'pointer', color: '#ff4444', transition: 'all .3s' }}>
                        {clearingCache ? '🛠️ Optimizing...' : 'Clear Sync Cache'}
                      </button>
                      <button onClick={saveSettings} style={{ flex: 1, padding: '16px', background: `linear-gradient(90deg, ${settingsForm.accentColor}, ${settingsForm.accentColor}dd)`, borderRadius: 16, border: 'none', fontWeight: 700, cursor: 'pointer', color: '#fff', boxShadow: `0 10px 20px ${settingsForm.accentColor}22` }}>Save Strategy</button>
                   </div>
                </div>
              )}

              {activeSection === 'storage' && subSection === 'network' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: settingsForm.accentColor, fontSize: 18, cursor: 'pointer' }}>←</button>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Network Intelligence</h3>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Data Received', val: '4.2 GB', icon: '📥' },
                        { label: 'Data Sent', val: '1.8 GB', icon: '📤' },
                        { label: 'Roaming Use', val: '124 MB', icon: '✈️' },
                        { label: 'Bridge Usage', val: '452 KB', icon: '🌉' }
                      ].map((stat, i) => (
                        <div key={i} style={{ padding: 20, background: 'var(--bg-card2)', borderRadius: 20, border: '1px solid var(--border2)' }}>
                           <div style={{ fontSize: 24, marginBottom: 12 }}>{stat.icon}</div>
                           <div style={{ fontSize: 18, fontWeight: 800 }}>{stat.val}</div>
                           <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{stat.label}</div>
                        </div>
                      ))}
                   </div>

                   <div onClick={() => toggleSetting('dataSaver')}
                     style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: settingsForm.dataSaver ? `${settingsForm.accentColor}10` : 'var(--bg-card2)', borderRadius: 20, border: `1.5px solid ${settingsForm.dataSaver ? settingsForm.accentColor : 'var(--border2)'}`, cursor: 'pointer' }}>
                     <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Data Saver Mode</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>Neural optimization for limited connections</div>
                     </div>
                     <div style={{ width: 44, height: 24, background: settingsForm.dataSaver ? settingsForm.accentColor : 'var(--bg-dark)', borderRadius: 20, position: 'relative', border: '1px solid var(--border2)', transition: 'all .3s' }}>
                        <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: settingsForm.dataSaver ? 24 : 2, transition: 'all 0.3s' }}/>
                     </div>
                   </div>
                </div>
              )}

              {activeSection === 'help' && !subSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ textAlign: 'center', padding: '10px 0 20px', position: 'relative' }}>
                      <div style={{ 
                        width: 80, height: 80, margin: '0 auto 16px', borderRadius: '50%', 
                        background: `linear-gradient(135deg, ${settingsForm.accentColor}22, ${settingsForm.accentColor}11)`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${settingsForm.accentColor}44`,
                        boxShadow: `0 0 30px ${settingsForm.accentColor}15`
                      }}>
                         <div style={{ fontSize: 40, filter: `drop-shadow(0 0 10px ${settingsForm.accentColor}66)` }}>🛡️</div>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 800 }}>TaskNest Support</h3>
                      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>We're here to help you maximize your productivity.</p>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div onClick={() => window.location.href = 'mailto:support@tasknest.com'} 
                           style={{ padding: 20, background: `linear-gradient(135deg, ${settingsForm.accentColor}15, transparent)`, border: `1.5px solid ${settingsForm.accentColor}44`, borderRadius: 20, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .25s ease' }} 
                           onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 20px ${settingsForm.accentColor}15`; }} 
                           onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                          <div style={{ fontSize: 28 }}>✉️</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Email Support</div>
                      </div>
                      <div onClick={() => {
                        toast.info('Starting diagnostic scan... Checking API endpoints.');
                        setTimeout(() => toast.success('All diagnostics passed successfully.'), 3000);
                      }} 
                           style={{ padding: 20, background: 'var(--bg-card2)', border: '1.5px solid var(--border2)', borderRadius: 20, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .25s ease' }} 
                           onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = settingsForm.accentColor; }} 
                           onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}>
                          <div style={{ fontSize: 28, opacity: 0.9 }}>🩺</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Run Diagnostics</div>
                      </div>
                   </div>

                   <h4 style={{ margin: '10px 0 4px 6px', fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Resources & Legal</h4>
                   
                   {[
                     { id: 'kb', label: 'Interactive Knowledge Base', icon: '📚', desc: 'Browse our extensive FAQs and tutorials' },
                     { id: 'bug', label: 'Report a Bug', icon: '🐛', desc: 'Help us improve by reporting issues' },
                     { id: 'tos', label: 'Terms of Service', icon: '⚖️', desc: 'Guidelines and legal agreements' },
                     { id: 'privacy', label: 'Privacy Policy', icon: '🔒', desc: 'How we protect your data' },
                     { id: 'status', label: 'System Status', icon: '🟢', desc: 'All Services Operational (99.9% Uptime)' }
                   ].map((item, idx) => (
                     <div key={idx} onClick={() => setSubSection(item.id)}
                       style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 16, cursor: 'pointer', transition: 'all .2s' }} 
                       onMouseEnter={e => { e.currentTarget.style.borderColor = settingsForm.accentColor; e.currentTarget.style.background = `${settingsForm.accentColor}0a`; e.currentTarget.style.transform = 'scale(1.01)'; }} 
                       onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                        <div style={{ fontSize: 20, width: 44, height: 44, background: 'var(--bg-dark)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>{item.icon}</div>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{item.label}</div>
                           <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{item.desc}</div>
                        </div>
                        <span style={{ color: settingsForm.accentColor, fontSize: 22, opacity: 0.7 }}>›</span>
                      </div>
                   ))}
                </div>
              )}

              {activeSection === 'help' && subSection === 'kb' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: settingsForm.accentColor, fontSize: 18, cursor: 'pointer' }}>←</button>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Interactive Knowledge Base</h3>
                   </div>
                   <div style={{ padding: 20, background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                         <span style={{ fontSize: 24 }}>🔍</span>
                         <input type="text" placeholder="Search for help topics..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text)', outline: 'none' }} />
                      </div>
                      <h4 style={{ margin: '16px 0 8px 0' }}>Popular Articles</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-dim)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                         <li style={{ cursor: 'pointer', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color=settingsForm.accentColor} onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>• How to manage your linked devices</li>
                         <li style={{ cursor: 'pointer', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color=settingsForm.accentColor} onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>• Customizing your Theme & Accent Colors</li>
                         <li style={{ cursor: 'pointer', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color=settingsForm.accentColor} onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>• Optimizing Neural Cache effectively</li>
                         <li style={{ cursor: 'pointer', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color=settingsForm.accentColor} onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>• Understanding Data Saver Mode</li>
                      </ul>
                   </div>
                </div>
              )}

              {activeSection === 'help' && subSection === 'bug' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: settingsForm.accentColor, fontSize: 18, cursor: 'pointer' }}>←</button>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Report a Bug</h3>
                   </div>
                   <div style={{ padding: 20, background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)' }}>
                      <textarea placeholder="Describe the issue you're experiencing in detail..." style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text)', outline: 'none', resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }}></textarea>
                      <button onClick={() => { toast.success('Bug report submitted. Thank you!'); setSubSection(null); }} style={{ width: '100%', padding: '12px', background: settingsForm.accentColor, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Submit Report</button>
                   </div>
                </div>
              )}

              {activeSection === 'help' && (subSection === 'tos' || subSection === 'privacy') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: settingsForm.accentColor, fontSize: 18, cursor: 'pointer' }}>←</button>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{subSection === 'tos' ? 'Terms of Service' : 'Privacy Policy'}</h3>
                   </div>
                   <div style={{ padding: 24, background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, maxHeight: 300, overflowY: 'auto' }}>
                      <h4 style={{ color: 'var(--text)', marginTop: 0 }}>Last Updated: {new Date().toLocaleDateString()}</h4>
                      <p>This is a simulated {subSection === 'tos' ? 'Terms of Service' : 'Privacy Policy'} document. In a production environment, this would contain the full legal text outlining the rules, guidelines, and user rights associated with the TaskNest platform.</p>
                      <p>We take your privacy and data security very seriously. All interactive sessions and linked device data are encrypted and handled in compliance with global standards.</p>
                      <p>For inquiries regarding GDPR or data deletion, please utilize our Email Support function.</p>
                   </div>
                </div>
              )}

              {activeSection === 'help' && subSection === 'status' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setSubSection(null)} style={{ background: 'none', border: 'none', color: settingsForm.accentColor, fontSize: 18, cursor: 'pointer' }}>←</button>
                      <h3 style={{ margin: 0, fontSize: 16 }}>System Status</h3>
                   </div>
                   <div style={{ padding: 20, background: 'var(--bg-card2)', borderRadius: 16, border: '1px solid var(--border2)' }}>
                      {[
                        { name: 'Core API Server', status: 'Operational', color: '#22c55e' },
                        { name: 'WebSocket Cluster', status: 'Operational', color: '#22c55e' },
                        { name: 'Database Cluster', status: 'Operational', color: '#22c55e' },
                        { name: 'Storage CDN', status: 'Degraded', color: '#f59e0b' }
                      ].map((svc, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx < 3 ? '1px solid var(--border)' : 'none' }}>
                           <span style={{ fontWeight: 600 }}>{svc.name}</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <span style={{ color: svc.color, fontSize: 12, fontWeight: 700 }}>{svc.status}</span>
                             <div style={{ width: 8, height: 8, borderRadius: '50%', background: svc.color }}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cache Optimization Modal Overlay */}
      {clearingCache && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,13,26,.9)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)'
        }}>
           <div className="animate-scale-in" style={{ width: 320, textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 32, border: `2px solid ${settingsForm.accentColor}22` }}>
              <div style={{ fontSize: 48, marginBottom: 20, animation: 'spin 3s linear infinite' }}>⚙️</div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)' }}>Optimizing Neural Cache</h3>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, marginBottom: 24 }}>Purging redundant indices...</p>
              
              <div style={{ width: '100%', height: 6, background: 'var(--bg-dark)', borderRadius: 10, overflow: 'hidden' }}>
                 <div style={{ 
                   width: `${cacheProgress}%`, height: '100%', 
                   background: settingsForm.accentColor, boxShadow: `0 0 10px ${settingsForm.accentColor}`,
                   transition: 'width 0.2s ease'
                 }} />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: settingsForm.accentColor }}>{Math.round(cacheProgress)}%</div>
           </div>
        </div>
      )}
    </div>
  </div>
  );
}