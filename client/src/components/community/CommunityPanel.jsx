import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';

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
  const { user, setUser } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [activeRoom, setActiveRoom] = useState(null);
  const [fullDetail, setFullDetail] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', emoji: '🏘️', category: 'Technology', privacy: 'public' });
  
  const fileRef = useRef(null);

  useEffect(() => { fetchCommunities(); }, [category, search]);

  useEffect(() => {
    if (selected?._id) {
       fetchFullDetail(selected._id);
       setActiveRoom(null);  
    }
  }, [selected?._id]);

  const fetchCommunities = async () => {
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.q = search;
      const r = await api.get('/community', { params });
      setCommunities(r.data.communities || []);
    } catch {}
  };

  const fetchFullDetail = async (id) => {
    try {
      const r = await api.get(`/community/${id}`);
      setFullDetail(r.data.community);
    } catch {}
  };

  const joinCommunity = async (id, name) => {
    try {
      await api.post(`/community/${id}/join`);
      
       
      if (user) {
        setUser({
          ...user,
          communities: [...(user.communities || []), id]
        });
      }
      
      toast.success(`Joined ${name}! ✨`);
      fetchCommunities();
      fetchFullDetail(id);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to join'); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const createCommunity = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const fData = new FormData();
      Object.keys(form).forEach(key => fData.append(key, form[key]));
      if (avatarFile) fData.append('avatar', avatarFile);

      const res = await api.post('/community', fData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

       
      if (user && res.data.community) {
        setUser({
          ...user,
          communities: [...(user.communities || []), res.data.community._id]
        });
      }

      toast.success('Community created! 🚀');
      setShowCreate(false);
      setForm({ name: '', description: '', emoji: '🏘️', category: 'Technology', privacy: 'public' });
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchCommunities();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create'); }
    setLoading(false);
  };

  const handleKick = async (userId) => {
    if (!selected || !confirm('Kick this member?')) return;
    try {
      await api.post(`/community/${selected._id}/kick/${userId}`);
      toast.success('Member removed');
      fetchFullDetail(selected._id);
    } catch (e) { toast.error('Failed to remove member'); }
  };

  const handleAddMember = async () => {
     const username = prompt('Enter username to add:');
     if (!username) return;
     try {
        
       await api.post(`/community/${selected._id}/add-member`, { username });
       toast.success(`${username} added!`);
       fetchFullDetail(selected._id);
     } catch (e) { toast.error(e.response?.data?.message || 'Failed to add user'); }
  }

  const handleCreateRoom = async () => {
    const name = prompt('Enter Room Name:');
    if (!name || !selected) return;
    try {
      await api.post(`/community/${selected._id}/rooms`, { name });
      toast.success('Room created!');
      fetchFullDetail(selected._id);
    } catch (e) { toast.error('Failed to create room'); }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!selected || !confirm('Delete this room?')) return;
    try {
      await api.delete(`/community/${selected._id}/rooms/${roomId}`);
      toast.success('Room removed');
      fetchFullDetail(selected._id);
    } catch (e) { toast.error('Failed to remove room'); }
  };

  const openRoomChat = (room) => {
     setActiveRoom(room);
     setActiveTab('chat');
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      { }
      <div style={{ width: 340, background: 'var(--bg-card2)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>Communities</h1>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>Connect with like-minded people</p>
          </div>
        </div>

        { }
        <div style={{ margin: '0 20px 16px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Explore communities…"
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '12px 14px 12px 42px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        { }
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
              background: category === cat ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'rgba(255,255,255,.06)',
              color: category === cat ? '#fff' : 'var(--text-dim)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: category === cat ? '0 4px 12px rgba(0,201,177,.25)' : 'none',
              transition: 'all .2s'
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
          <div style={{ padding: '0 12px' }}>
            {communities.map(c => {
              const isSelected = selected?._id === c._id;
              return (
                <div key={c._id} onClick={() => setSelected(c)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px', cursor: 'pointer', 
                    transition: 'all .2s', background: isSelected ? 'rgba(0,201,177,.08)' : 'transparent', 
                    borderRadius: 16, marginBottom: 4,
                    border: isSelected ? '1.5px solid rgba(0,201,177,.3)' : '1.5px solid transparent',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ 
                    width: 50, height: 50, borderRadius: 16, flexShrink: 0, overflow: 'hidden',
                    background: c.avatar ? `url(${c.avatar}) center/cover no-repeat` : `linear-gradient(135deg,${GRADIENT_MAP[c.category] || GRADIENT_MAP.Other})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
                  }}>
                    {!c.avatar && (c.emoji || '🏘️')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      {c.verified && <span style={{ fontSize: 14 }}>✨</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{c.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>👥 {c.memberCount || 0}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>•</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {communities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.5 }}>🏘️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No communities yet</div>
              <p style={{ fontSize: 13 }}>Be the first to create one!</p>
            </div>
          )}
        </div>
        
        <div style={{ padding: 16, borderTop: '1px solid var(--border2)' }}>
           <button onClick={() => setShowCreate(true)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,201,177,.2)' }}>
             + Create New Community
           </button>
        </div>
      </div>

      { }
      <div style={{ flex: 1, background: 'var(--bg-dark)', overflowY: 'auto' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', padding: 40, textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 30 }}>
              <div style={{ fontSize: 120, filter: 'blur(20px)', opacity: 0.2, position: 'absolute', top: 0, left: 0 }}>🏘️</div>
              <div style={{ fontSize: 80, position: 'relative', zIndex: 1 }}>🏙️</div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 12, maxWidth: 400 }}>Find your place in the world</h2>
            <p style={{ fontSize: 16, marginBottom: 32, maxWidth: 500, lineHeight: 1.6 }}>Discover thousands of communities sharing your interests, from tech and gaming to art and business.</p>
            <div style={{ display: 'flex', gap: 16 }}>
               <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border2)', textAlign: 'center' }}>
                 <div style={{ fontSize: 24, marginBottom: 8 }}>💎</div>
                 <div style={{ fontWeight: 700, fontSize: 14 }}>Verified Hubs</div>
               </div>
               <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border2)', textAlign: 'center' }}>
                 <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                 <div style={{ fontWeight: 700, fontSize: 14 }}>Live Chats</div>
               </div>
               <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border2)', textAlign: 'center' }}>
                 <div style={{ fontSize: 24, marginBottom: 8 }}>🌈</div>
                 <div style={{ fontWeight: 700, fontSize: 14 }}>Diverse Topics</div>
               </div>
            </div>
          </div>
        ) : (
          <CommunityDetail 
            community={fullDetail || selected} 
            onJoin={() => joinCommunity(selected._id, selected.name)} 
            gradient={GRADIENT_MAP[selected.category] || GRADIENT_MAP.Other}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={user}
            onKick={handleKick}
            onAddMember={handleAddMember}
            onCreateRoom={handleCreateRoom}
            onDeleteRoom={handleDeleteRoom}
            activeRoom={activeRoom}
            onOpenRoom={openRoomChat}
          />
        )}
      </div>

      { }
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: 36, width: 500, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.3s ease-out' }}>
            <style>{`
              @keyframes modalIn { from{opacity:0; transform:scale(.95) translateY(20px)} to{opacity:1; transform:scale(1) translateY(0)} }
            `}</style>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>Setup Community</h2>
                <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '6px 0 0' }}>Launch your new space in seconds</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,.05)', border: 'none', color: 'var(--text-dim)', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
               <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
               <div 
                 onClick={() => fileRef.current?.click()}
                 style={{ 
                    width: 100, height: 100, borderRadius: 24, 
                    border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-dark)'
                 }}>
                  {!avatarPreview && (
                    <>
                      <div style={{ fontSize: 32 }}>{form.emoji}</div>
                      <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, marginTop: 4 }}>CHANGE</div>
                    </>
                  )}
                  {avatarPreview && <div style={{ background: 'rgba(0,0,0,0.5)', width: '100%', padding: '4px 0', position: 'absolute', bottom: 0, textAlign: 'center', fontSize: 9, color: '#fff', fontWeight: 800 }}>EDIT</div>}
               </div>
               <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Community Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Design Enthusiasts"
                    style={inputStyle} />
                  <div style={{ marginTop: 10 }}>
                     <label style={{ ...labelStyle, marginBottom: 4 }}>Emoji Badge</label>
                     <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} 
                        style={{ ...inputStyle, padding: '8px 12px', width: 60, textAlign: 'center', fontSize: 20 }} />
                  </div>
               </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.slice(1).map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))} 
                    style={{ 
                      padding: '8px 14px', borderRadius: 10, border: '1px solid', 
                      borderColor: form.category === c ? 'var(--teal)' : 'var(--border2)', 
                      background: form.category === c ? 'var(--teal-glow)' : 'transparent',
                      color: form.category === c ? 'var(--teal)' : 'var(--text-dim)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .25s'
                    }}>{c}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell people what this community is about..."
                style={{ ...inputStyle, minHeight: 100, resize: 'none' }} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Visibility & Access</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { id: 'public', label: 'Public', sub: 'Anyone can join', icon: '🔓' },
                  { id: 'private', label: 'Private', sub: 'Approval needed', icon: '🛡️' },
                ].map(p => (
                  <div key={p.id} onClick={() => setForm(pr => ({ ...pr, privacy: p.id }))} 
                    style={{ 
                      padding: 16, borderRadius: 16, border: '2px solid', 
                      borderColor: form.privacy === p.id ? 'var(--teal)' : 'var(--border2)', 
                      background: form.privacy === p.id ? 'var(--teal-glow)' : 'rgba(255,255,255,.02)',
                      cursor: 'pointer', transition: 'all .2s'
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={createCommunity} disabled={loading || !form.name.trim()}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 16, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 24px rgba(0,201,177,.3)' }}>
              {loading ? 'Creating...' : '🚀 Launch Community'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommunityDetail({ community, onJoin, gradient, activeTab, setActiveTab, currentUser, onKick, onAddMember, onCreateRoom, onDeleteRoom, activeRoom, onOpenRoom }) {
  const isAdmin = community.admins?.some(a => a === currentUser?._id) || community.creator?._id === currentUser?._id;
  
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      { }
      <div style={{ height: 200, background: community.banner ? `url(${community.banner}) center/cover no-repeat` : `linear-gradient(135deg,${gradient})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 32px 32px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, position: 'relative', zIndex: 2 }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: 28, 
            background: community.avatar ? `url(${community.avatar}) center/cover no-repeat` : 'rgba(255,255,255,.15)', 
            border: '4px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: 52, backdropFilter: 'blur(10px)', 
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            {!community.avatar && (community.emoji || '🏘️')}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{community.name}</h1>
              {community.verified && <span title="Verified Hub" style={{ fontSize: 24 }}>🛡️</span>}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.9)', marginTop: 6, fontWeight: 500 }}>
              <span style={{ background: 'rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: 20 }}>{community.category}</span>
              <span style={{ margin: '0 10px' }}>•</span>
              <span style={{ fontWeight: 700 }}>{community.memberCount || 0}</span> members
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', top: 32, right: 32, display: 'flex', gap: 12 }}>
           <button onClick={onJoin} style={{ padding: '12px 28px', background: '#fff', border: 'none', borderRadius: 12, color: '#000', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
             Join Community
           </button>
        </div>
      </div>

      { }
      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border2)', display: 'flex', gap: 32, background: 'var(--bg-card)' }}>
         {['About', 'Rooms', 'Members', 'Rules', 'Chat'].map(t => {
           const id = t.toLowerCase();
           if (id === 'chat' && !activeRoom) return null;
           return (
             <button key={id} onClick={() => setActiveTab(id)} style={{
               padding: '18px 0', background: 'none', border: 'none', borderBottom: activeTab === id ? '3px solid var(--teal)' : '3px solid transparent',
               color: activeTab === id ? 'var(--text)' : 'var(--text-dim)', fontWeight: activeTab === id ? 700 : 500, fontSize: 14, cursor: 'pointer', transition: 'all .2s'
             }}>
               {t === 'Chat' ? `💬 ${activeRoom?.name}` : t}
             </button>
           );
         })}
      </div>

      { }
      <div style={{ padding: 32, flex: 1 }}>
        {activeTab === 'about' && (
          <div style={{ maxWidth: 1000, display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 300px', gap: 40 }}>
            <div style={{ minWidth: 0 }}>
              <section style={{ marginBottom: 40 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 16 }}>About the Community</h3>
                <div style={{ background: 'var(--bg-card2)', padding: 24, borderRadius: 24, border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.8 }}>
                   {community.description || 'Welcome! We are a group of passionate individuals sharing interests and growing together. Join us to start the conversation!'}
                </div>
              </section>

              <section>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Quick Guidelines</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                   {(community.rules?.length ? community.rules : ['Stay respectful', 'No spam', 'No hate speech']).slice(0, 3).map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,.02)', padding: 16, borderRadius: 16, border: '1px solid var(--border2)' }}>
                         <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--teal-glow)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{i+1}</div>
                         <div style={{ fontSize: 14, color: 'var(--text)' }}>{r}</div>
                      </div>
                   ))}
                </div>
              </section>
            </div>

            <div style={{ flexShrink: 0 }}>
               <div style={{ background: 'var(--bg-card2)', borderRadius: 24, padding: 24, border: '1px solid var(--border2)', position: 'sticky', top: 0 }}>
                 <h4 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Organization Details</h4>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👑</div>
                       <div>
                         <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Founder</div>
                         <div style={{ fontSize: 14, fontWeight: 700 }}>{community.creator?.name || 'Administrative'}</div>
                       </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,133,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗓️</div>
                       <div>
                         <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Established</div>
                         <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(community.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,71,87,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔒</div>
                       <div>
                         <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Privacy Level</div>
                         <div style={{ fontSize: 14, fontWeight: 700 }}>{community.privacy?.toUpperCase() || 'PUBLIC'}</div>
                       </div>
                    </div>
                 </div>

                 <div style={{ height: 1.5, background: 'var(--border2)', margin: '24px 0' }} />
                 <div>
                   <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, textAlign: 'center' }}>Invite your friends!</div>
                   <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Copy Invite Link</button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div style={{ maxWidth: 1000 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>Discussion Rooms</h3>
               {isAdmin && <button onClick={onCreateRoom} style={{ padding: '8px 16px', background: 'var(--teal-glow)', border: '1px solid var(--teal)', borderRadius: 10, color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Room</button>}
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                <div style={roomCardStyle}>
                   <div style={roomIconStyle}>🌐</div>
                   <div style={{ flex:1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>General Chat</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>The main lobby for everyone</div>
                   </div>
                   <button onClick={() => onOpenRoom({ _id: community.chat, name: 'General Chat' })} style={roomJoinBtnStyle}>Open</button>
                </div>
                {(community.rooms || []).map(r => (
                  <div key={r._id} style={roomCardStyle}>
                     <div style={roomIconStyle}>💬</div>
                     <div style={{ flex:1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{r.participants?.length || 0} members</div>
                     </div>
                     <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onOpenRoom(r)} style={roomJoinBtnStyle}>Join</button>
                        {isAdmin && <button onClick={() => onDeleteRoom(r._id)} style={{ ...roomJoinBtnStyle, background: 'rgba(255,71,87,.1)', color: 'var(--red)', border: '1px solid var(--red)' }}>✕</button>}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'rules' && (
           <div style={{ maxWidth: 800 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                   <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: 0 }}>Community Guidelines</h3>
                   <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>Standard rules for a healthy community</p>
                </div>
                {isAdmin && (
                   <button onClick={() => {
                      const rule = prompt('Enter a new community rule:');
                      if (rule) {
                         api.patch(`/community/${community._id}/rules`, { rules: [...(community.rules || []), rule] })
                          .then(() => toast.success('Rules updated!'))
                          .catch(() => toast.error('Failed to update'));
                      }
                   }} style={{ padding: '10px 20px', background: 'var(--teal)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Manage Rules</button>
                )}
              </div>
              
              <div style={{ display: 'grid', gap: 20 }}>
                 {(community.rules?.length ? community.rules : ['Stay respectful', 'No spam', 'No hate speech', 'Follow the moderators']).map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 20, background: 'var(--bg-card2)', padding: 24, borderRadius: 24, border: '1px solid var(--border2)', transition: 'transform .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                       <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>{i + 1}</div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Guideline #{i + 1}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.6 }}>{r}</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'members' && (
          <div style={{ maxWidth: 800 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>All Members ({community.members?.length || 0})</h3>
               {isAdmin && <button onClick={onAddMember} style={{ padding: '8px 16px', background: 'var(--teal-glow)', border: '1px solid var(--teal)', borderRadius: 10, color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Member</button>}
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {(community.members || []).map((m, i) => {
                  const isOwner = m._id === community.creator?._id || m._id === community.creator;
                  const isMe = m._id === currentUser?._id;
                  const isTargetAdmin = community.admins?.some(a => a === m._id || a._id === m._id);

                  return (
                    <div key={i} style={{ padding: 16, background: isMe ? 'rgba(0,201,177,.05)' : 'var(--bg-card2)', border: isMe ? '1px solid var(--teal)' : '1px solid var(--border2)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Avatar name={m.name} src={m.avatar} size={40} online={m.isOnline} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: isMe ? 'var(--teal)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {m.name || 'Anonymous'} {isMe && '(You)'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{isOwner ? '👑 Owner' : 'Member'}</div>
                      </div>
                      {isAdmin && !isMe && !isOwner && (
                        <button onClick={() => onKick(m._id)} title="Remove Member" style={{ background: 'rgba(255,71,87,.1)', border: 'none', color: 'var(--red)', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {activeTab === 'chat' && activeRoom && (
           <div style={{ height: '70vh', background: 'var(--bg-card2)', borderRadius: 24, border: '1px solid var(--border2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
               <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                     <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
                     <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{activeRoom.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>Connected to Discussion Hub</div>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('rooms')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>Back to Rooms</button>
               </div>
               <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>
                  <div>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Connecting to Socket...</div>
                    <p style={{ maxWidth: 300, fontSize: 14 }}>The chat real-time engine is loading for <b>{activeRoom.name}</b>. Messages will appear here.</p>
                  </div>
               </div>
           </div>
        )}
      </div>
    </div>
  );
}


const roomCardStyle = { padding: 16, background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 };
const roomIconStyle = { width: 42, height: 42, borderRadius: 12, background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 };
const roomJoinBtnStyle = { padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer' };

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '14px 18px', color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color .25s' };

