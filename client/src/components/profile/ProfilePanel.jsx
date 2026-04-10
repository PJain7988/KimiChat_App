import React, { useState } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#00c9b1', '#1a8cff', '#7c5cfc', '#ff4fa3', '#ffb830', '#ff6b35', '#22c55e'];

export default function ProfilePanel() {
  const { user, setUser, logout } = useAuthStore();
  const { chats } = useChatStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', avatarColor: user?.avatarColor || '#00c9b1' });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/update/profile', form);
      setUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const friendCount = user?.friends?.length || 0;
  const groupCount = chats.filter(c => c.isGroup).length;
  const communityCount = user?.communities?.length || 0;

  const SETTINGS = [
    { icon: '👤', label: 'Edit Account',       color: 'rgba(0,201,177,.15)',   onClick: () => setEditing(true) },
    { icon: '🔒', label: 'Privacy & Security', color: 'rgba(26,140,255,.15)',  onClick: () => setActiveSection('privacy') },
    { icon: '🔔', label: 'Notifications',       color: 'rgba(124,92,252,.15)', onClick: () => setActiveSection('notifications') },
    { icon: '🌙', label: 'Appearance',          color: 'rgba(255,184,48,.15)', onClick: () => setActiveSection('appearance') },
    { icon: '🤖', label: 'AI Settings',         color: 'rgba(255,79,163,.15)', onClick: () => setActiveSection('ai') },
    { icon: '📱', label: 'Linked Devices',      color: 'rgba(34,197,94,.15)',  onClick: () => setActiveSection('devices') },
    { icon: '💾', label: 'Storage & Data',      color: 'rgba(255,107,53,.15)', onClick: () => setActiveSection('storage') },
    { icon: '❓', label: 'Help & Support',      color: 'rgba(26,140,255,.15)', onClick: () => {} },
    { icon: '🚪', label: 'Sign Out',            color: 'rgba(255,68,68,.15)', textColor: 'var(--red)', onClick: () => logout() },
  ];

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Banner */}
        <div style={{ height: 180, background: 'linear-gradient(135deg,var(--teal),var(--blue))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 50%,rgba(255,255,255,.1),transparent)' }} />
          <button onClick={() => setEditing(true)} style={{ position: 'absolute', bottom: 16, right: 20, padding: '9px 18px', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✏️ Edit Profile
          </button>
        </div>

        {/* Avatar */}
        <div style={{ padding: '0 28px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -50, left: 28 }}>
            <div style={{ padding: 3, borderRadius: '50%', background: 'var(--bg-dark)' }}>
              <Avatar name={user?.name} src={user?.avatar} size={84} gradient={`${user?.avatarColor || 'var(--teal)'},var(--blue)`} online={true} />
            </div>
          </div>

          {/* Info */}
          <div style={{ paddingTop: 52 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: 14, color: 'var(--teal)', marginTop: 2 }}>@{user?.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>🆔 {user?.kimichatId}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>{user?.bio || 'No bio yet. Add one!'}</div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Friends', value: friendCount },
                { label: 'Groups', value: groupCount },
                { label: 'Communities', value: communityCount },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Settings List */}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Settings</div>
            {SETTINGS.map((s, i) => (
              <div key={i} onClick={s.onClick}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 14, marginBottom: 10, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: s.textColor || 'var(--text)' }}>{s.label}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 24, padding: 28, width: 440, boxShadow: 'var(--shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>✏️ Edit Profile</div>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Avatar preview */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar name={form.name || user?.name} size={72} gradient={`${form.avatarColor},var(--blue)`} style={{ margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.avatarColor === c ? '3px solid #fff' : '3px solid transparent', transition: 'all .2s' }} />
                ))}
              </div>
            </div>

            {[
              { label: 'Display Name', key: 'name', type: 'text', placeholder: 'Your name' },
              { label: 'Bio', key: 'bio', type: 'text', placeholder: 'Tell people about yourself' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} type={f.type} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            ))}

            {/* Read-only fields */}
            {[
              { label: 'Email', value: user?.email },
              { label: 'KimiChat ID', value: user?.kimichatId },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                <input readOnly value={f.value || ''} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px', color: 'var(--text-dim)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 13, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', borderRadius: 12, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: 13, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Save Changes ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
