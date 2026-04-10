import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Gaming', 'Art & Design', 'Music', 'Sports', 'Education', 'Business'];

const GRADIENT_MAP = {
  Technology:    'var(--teal),var(--blue)',
  Gaming:        '#ff6b35,var(--gold)',
  'Art & Design':'var(--gold),var(--pink)',
  Music:         'var(--pink),var(--purple)',
  Sports:        'var(--green),var(--teal)',
  Education:     'var(--blue),var(--purple)',
  Business:      'var(--purple),var(--blue)',
  Other:         'var(--teal),var(--purple)',
};

export default function CommunityPanel() {
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', emoji: '🏘️', category: 'Technology', privacy: 'public' });

  useEffect(() => { fetchCommunities(); }, [category, search]);

  const fetchCommunities = async () => {
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.q = search;
      const r = await api.get('/community', { params });
      setCommunities(r.data.communities || []);
    } catch {}
  };

  const joinCommunity = async (id, name) => {
    try {
      await api.post(`/community/${id}/join`);
      toast.success(`Joined ${name}!`);
      fetchCommunities();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to join'); }
  };

  const createCommunity = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await api.post('/community', form);
      toast.success('Community created!');
      setShowCreate(false);
      setForm({ name: '', description: '', emoji: '🏘️', category: 'Technology', privacy: 'public' });
      fetchCommunities();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create'); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Left: Community List */}
      <div style={{ width: 340, background: 'var(--bg-card2)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Community</div>
          <button onClick={() => setShowCreate(true)} style={{ padding: '8px 14px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Create</button>
        </div>

        {/* Search */}
        <div style={{ margin: '0 16px 10px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities…"
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
              background: category === cat ? 'linear-gradient(90deg,var(--teal),var(--blue))' : 'rgba(255,255,255,.06)',
              color: category === cat ? '#fff' : 'var(--text-dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          {communities.map(c => {
            const isSelected = selected?._id === c._id;
            return (
              <div key={c._id} onClick={() => setSelected(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background .2s', background: isSelected ? 'var(--teal-glow)' : 'transparent', borderLeft: isSelected ? '3px solid var(--teal)' : '3px solid transparent' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${GRADIENT_MAP[c.category] || GRADIENT_MAP.Other})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {c.emoji || '🏘️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    {c.verified && <span style={{ fontSize: 12 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>👥 {(c.memberCount || 0).toLocaleString()} members</div>
                </div>
              </div>
            );
          })}
          {communities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏘️</div>
              <div style={{ fontSize: 14 }}>No communities found</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Community Detail */}
      <div style={{ flex: 1, background: 'var(--bg-dark)', overflowY: 'auto' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏘️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Explore Communities</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Select a community to view details</div>
            <button onClick={() => setShowCreate(true)} style={{ padding: '12px 28px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              + Create Community
            </button>
          </div>
        ) : (
          <CommunityDetail community={selected} onJoin={() => joinCommunity(selected._id, selected.name)} gradient={GRADIENT_MAP[selected.category] || GRADIENT_MAP.Other} />
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 24, padding: 28, width: 460, boxShadow: 'var(--shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700 }}>🏘️ Create Community</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            {[
              { label: 'Community Name', key: 'name', placeholder: 'My Awesome Community' },
              { label: 'Description', key: 'description', placeholder: 'What is this community about?' },
              { label: 'Emoji Icon', key: 'emoji', placeholder: '🏘️' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>Privacy</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['public', 'private', 'invite'].map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, flex: 1, background: form.privacy === p ? 'var(--teal-glow)' : 'rgba(255,255,255,.04)', borderRadius: 10, padding: '10px 14px', border: `1px solid ${form.privacy === p ? 'var(--teal)' : 'var(--border2)'}` }}>
                    <input type="radio" name="privacy" checked={form.privacy === p} onChange={() => setForm(pr => ({ ...pr, privacy: p }))} style={{ accentColor: 'var(--teal)' }} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={createCommunity} disabled={loading || !form.name.trim()}
              style={{ width: '100%', padding: 14, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Creating…' : '🚀 Create Community'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommunityDetail({ community, onJoin, gradient }) {
  return (
    <div>
      <div style={{ height: 160, background: `linear-gradient(135deg,${gradient})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {community.emoji || '🏘️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff' }}>{community.name}</div>
              {community.verified && <span>✅</span>}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>👥 {(community.memberCount || 0).toLocaleString()} members · {community.category}</div>
          </div>
        </div>
        <button onClick={onJoin} style={{ position: 'absolute', top: 16, right: 16, padding: '10px 22px', background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          Join Community
        </button>
      </div>

      <div style={{ padding: '24px', maxWidth: 700 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>About</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{community.description || 'No description provided.'}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Members', value: (community.memberCount || 0).toLocaleString(), icon: '👥' },
            { label: 'Category', value: community.category, icon: '🏷️' },
            { label: 'Privacy', value: community.privacy, icon: '🔒' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {community.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {community.tags.map(t => (
              <span key={t} style={{ padding: '4px 12px', background: 'var(--teal-glow)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--teal)' }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
