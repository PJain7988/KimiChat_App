import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

function InviteModal({ room, onClose, socket, sender }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inviteLink = `${window.location.origin}/app/global/${room?.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const searchUsers = async (val) => {
    setQuery(val);
    if (val.length < 2) return setResults([]);
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${val}`);
      setResults(res.data.users);
    } catch {}
    setLoading(false);
  };

  const inviteUser = async (userId, name) => {
    try {
      if (socket) {
        socket.emit('global:invite', {
          targetUserId: userId,
          roomId: room.id,
          roomName: room.name,
          roomEmoji: room.emoji,
          senderName: sender.name
        });
        toast.success(`Invitation sent to ${name}!`);
      }
    } catch {
      toast.error('Failed to send invite');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 24, padding: 28, width: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        animation: 'modalIn .25s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Invite to {room?.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, display: 'block' }}>Share the invite link</label>
          <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 12, padding: '4px 4px 4px 12px', alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inviteLink}</div>
            <button onClick={copyLink} style={{ padding: '8px 16px', background: 'var(--teal)', border: 'none', color: '#000', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Copy</button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border2)', margin: '20px 0' }} />

        <label style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, display: 'block' }}>Or search members to add</label>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input 
            value={query}
            onChange={e => searchUsers(e.target.value)}
            placeholder="Type a username..."
            style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', outline: 'none' }}
          />
        </div>

        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 12 }}>
               <Avatar name={u.name} src={u.avatar} size={32} />
               <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{u.name}</div>
               <button onClick={() => inviteUser(u._id, u.name)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--teal)', background: 'none', color: 'var(--teal)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Invite</button>
            </div>
          ))}
          {query.length > 2 && results.length === 0 && !loading && (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', padding: 10 }}>No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PollModal({ onClose, onSubmit }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx, val) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some(o => !o.trim())) {
      return toast.error('Please fill all fields');
    }
    const pollData = {
      type: 'poll',
      question: question.trim(),
      options: options.map((o, i) => ({ id: i, text: o.trim(), votes: [] }))
    };
    onSubmit(JSON.stringify(pollData));
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,13,26,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, width: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn .25s ease-out' }}>
        <h3 style={{ margin: '0 0 20px', fontFamily: 'var(--font-display)', fontSize: 22 }}>Create Poll 📊</h3>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Question</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask something..." style={inputStyle} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Options</label>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i+1}`} style={inputStyle} />
              {options.length > 2 && <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 20 }}>×</button>}
            </div>
          ))}
          {options.length < 5 && <button onClick={addOption} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0 }}>+ Add Option</button>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,var(--teal),var(--blue))', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create Poll</button>
        </div>
      </div>
    </div>
  );
}

function MembersModal({ room, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/global/rooms/${room.id}/members`);
        if (res.data.success) setMembers(res.data.members);
      } catch {
        setMembers([
          { name: 'Room Admin', status: 'online', role: 'Owner' },
          { name: 'You', status: 'online', role: 'Member' }
        ]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [room?.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,13,26,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, width: 400, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn .25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <div>
             <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Room Members 👥</h3>
             <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{room?.name}</div>
           </div>
           <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)' }}>Loading members...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map((m, i) => {
              const isMe = m._id === user._id;
              const isFriend = user.friends?.includes(m._id);
              
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.05)', borderRadius: 14 }}>
                   <Avatar name={m.name} src={m.avatar} size={32} />
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                     <div style={{ fontSize: 11, color: m.status === 'online' ? 'var(--green)' : 'var(--text-dim)' }}>{m.status}</div>
                   </div>
                   
                   {!isMe && !isFriend && (
                     <button 
                       onClick={async (e) => {
                         e.stopPropagation();
                         try {
                           await api.post(`/friends/request/${m._id}`);
                           toast.success(`Request sent to ${m.name}`);
                         } catch (err) {
                           toast.error(err.response?.data?.message || 'Failed to connect');
                         }
                       }}
                       style={{ 
                         background: 'var(--teal-glow)', 
                         border: '1px solid var(--teal)', 
                         color: 'var(--teal)', 
                         fontSize: 10, 
                         fontWeight: 700, 
                         padding: '4px 10px', 
                         borderRadius: 8, 
                         cursor: 'pointer' 
                       }}
                     >
                       + Connect
                     </button>
                   )}

                   <div style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: m.role === 'Owner' ? 'rgba(0,201,177,.1)' : 'rgba(255,255,255,.05)', color: m.role === 'Owner' ? 'var(--teal)' : 'var(--text-dim)' }}>{m.role}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RoomInfoModal({ room, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,13,26,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, width: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn .25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Room Information ℹ️</h3>
           <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
           <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 12px' }}>
              {room?.emoji}
           </div>
           <div style={{ fontSize: 20, fontWeight: 700 }}>{room?.name}</div>
           <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4 }}>#{room?.category}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           <div>
             <label style={labelStyle}>Description</label>
             <div style={{ fontSize: 13, color: 'var(--text-dim)', background: 'rgba(255,255,255,.05)', padding: 12, borderRadius: 12 }}>{room?.description || 'No description provided.'}</div>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Privacy</label>
                <div style={{ fontSize: 13 }}>{room?.type === 'public' ? '🔓 Public' : '🔒 Private'}</div>
              </div>
              <div>
                <label style={labelStyle}>Content</label>
                <div style={{ fontSize: 13 }}>{room?.isNSFW ? '🔞 NSFW' : '🛡️ Family Friendly'}</div>
              </div>
           </div>
           
           <div>
             <label style={labelStyle}>Activity</label>
             <div style={{ fontSize: 13 }}>👥 {(room?.membersCount || 0).toLocaleString()} members joined</div>
           </div>
        </div>
      </div>
    </div>
  );
}

function InvitationsModal({ invites, onAccept, onDecline, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,13,26,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn .25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22 }}>Invitations 📩</h3>
           <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        
        {invites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
             <div style={{ fontSize: 40, marginBottom: 12 }}>📫</div>
             <div style={{ fontSize: 14 }}>No pending invitations.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {invites.map((inv, i) => (
              <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border2)', borderRadius: 18 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                       {inv.roomEmoji || '🌐'}
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: 15, fontWeight: 700 }}>{inv.roomName}</div>
                       <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Invited by <span style={{ color: 'var(--teal)' }}>{inv.senderName}</span></div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => onAccept(inv)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--teal-glow)', border: '1px solid var(--teal)', color: 'var(--teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                    <button onClick={() => onDecline(inv)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', color: 'var(--text-dim)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Ignore</button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExitConfirmModal({ roomName, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(5,13,26,0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 28, padding: 32, width: 380, textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn .2s ease-out' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🚪</div>
        <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-display)', fontSize: 20 }}>Exit Room?</h3>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Are you sure you want to leave <strong style={{ color: 'var(--text)' }}>{roomName}</strong>? You can rejoin later from the public list.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>Stay</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Leave Room</button>
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lounge');
  const [type, setType] = useState('public');
  const [emoji, setEmoji] = useState('🌐');
  const [isNSFW, setIsNSFW] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const categories = ['Lounge', 'Tech', 'Gaming', 'Music', 'Education', 'Health', 'Finance'];

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/global/rooms', { 
        name, 
        description, 
        category, 
        type, 
        emoji, 
        isNSFW 
      });
      if (res.data.success) {
        toast.success(`Room "${name}" is now live!`);
        onCreate(res.data.room);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(5,13,26,0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 28, padding: 32, width: 480, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        animation: 'modalIn .3s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>Create Public Room</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>Design a unique space for the community.</div>
          </div>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        
        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
           <div style={{ position: 'relative' }}>
             <div onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,var(--bg-card2),var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, cursor: 'pointer', border: '1.5px solid var(--border2)', transition: 'all .2s' }}>
                {emoji}
             </div>
             {showEmojiPicker && (
               <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 10 }}>
                 <EmojiPicker theme="dark" onEmojiClick={(ed) => { setEmoji(ed.emoji); setShowEmojiPicker(false); }} />
               </div>
             )}
           </div>
           <div style={{ flex: 1 }}>
              <label style={labelStyle}>Room Identity</label>
              <input 
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Give your room a name..."
                style={inputStyle}
              />
           </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat} onClick={() => setCategory(cat)} style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                background: category === cat ? 'var(--teal-glow)' : 'rgba(255,255,255,.05)',
                border: category === cat ? '1px solid var(--teal)' : '1px solid var(--border2)',
                color: category === cat ? 'var(--teal)' : 'var(--text-dim)',
                transition: 'all .2s'
              }}>{cat}</div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>About this room (Optional)</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What should members expect here?"
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
           <div style={{ flex: 1 }}>
              <label style={labelStyle}>Room Privacy</label>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: 4, border: '1px solid var(--border2)' }}>
                <div onClick={() => setType('public')} style={{ ...tabStyle, background: type === 'public' ? 'var(--bg-card2)' : 'transparent', color: type === 'public' ? 'var(--teal)' : 'var(--text-dim)' }}>Public</div>
                <div onClick={() => setType('private')} style={{ ...tabStyle, background: type === 'private' ? 'var(--bg-card2)' : 'transparent', color: type === 'private' ? 'var(--teal)' : 'var(--text-dim)' }}>Private</div>
              </div>
           </div>
           <div style={{ flex: 1 }}>
              <label style={labelStyle}>Explicit Content</label>
              <div onClick={() => setIsNSFW(!isNSFW)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border2)', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: isNSFW ? 'var(--red)' : 'var(--text-dim)' }}>{isNSFW ? 'NSFW Active' : 'Family Friendly'}</span>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: isNSFW ? 'var(--red)' : 'rgba(255,255,255,.1)' }} />
              </div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Discard</button>
          <button onClick={submit} disabled={!name.trim() || loading} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,var(--teal),var(--blue))', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(0,201,177,0.3)', transition: 'all .2s' }}>
            {loading ? 'Initializing...' : 'Launch Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '12px 14px', color: 'var(--text)', outline: 'none', fontSize: 14, transition: 'all .2s' };
const tabStyle = { flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', borderRadius: 9, fontSize: 13, fontWeight: 600, transition: 'all .2s' };

export default function GlobalChat() {
  const { user } = useAuthStore();
  const { invitations, removeInvitation } = useChatStore();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [input, setInput] = useState('');
  const [roomQuery, setRoomQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [typers, setTypers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pinnedRooms, setPinnedRooms] = useState(() => JSON.parse(localStorage.getItem('pinned_rooms') || '[]'));
  const [mutedRooms, setMutedRooms] = useState(() => JSON.parse(localStorage.getItem('muted_rooms') || '[]'));
  const [showPicker, setShowPicker] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [pickerTab, setPickerTab] = useState('emoji');
  const endRef = useRef(null);
  const socket = getSocket();
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const audioMsg = JSON.stringify({ type: 'audio', url: reader.result });
          sendMsg(audioMsg);
          toast.success('Voice message sent!');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast('Recording started... 🎙️');
    } catch (err) {
      toast.error('Permission denied or no microphone found');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    
    const reader = new FileReader();
    reader.onload = () => {
      sendMsg(reader.result); 
      toast.success(`${file.type.startsWith('image/') ? 'Photo' : 'File'} sent!`);
    };
    reader.readAsDataURL(file);
  };

  const handleFeatureClick = (feature) => {
    if (feature === '📸 Photo' || feature === '📎 File') {
      fileInputRef.current.click();
    } else if (feature === '📊 Poll') {
      setShowPoll(true);
    } else if (feature === '🎤 Voice') {
      if (isRecording) stopRecording();
      else startRecording();
    }
  };

  const closePickers = () => {
    setShowPicker(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/global/rooms');
      if (res.data.success) {
        setRooms(res.data.rooms);
        if (!activeRoom) setActiveRoom(res.data.rooms[0]);
      }
    } catch (err) {
      toast.error('Failed to load global rooms');
    }
  };

  useEffect(() => {
    if (!activeRoom) return;
    loadMessages(activeRoom.id);
    if (socket) {
      socket.emit('global:join', activeRoom.id);
      socket.on('global:message', handleNewMsg);
      socket.on('global:typing', handleTyping);
    }
    return () => {
      if (socket) {
        socket.emit('global:leave', activeRoom.id);
        socket.off('global:message', handleNewMsg);
        socket.off('global:typing', handleTyping);
      }
    };
  }, [activeRoom?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (room) => {
    setLoading(true);
    try {
      const res = await api.get(`/global/${room}/messages`);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); }
    setLoading(false);
  };

  const handleNewMsg = (msg) => {
    setMessages(prev => {
      if (prev.some(m => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(roomQuery.toLowerCase()));
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aPinned = pinnedRooms.includes(a.id);
    const bPinned = pinnedRooms.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(msgSearchQuery.toLowerCase()) ||
    m.sender?.name?.toLowerCase().includes(msgSearchQuery.toLowerCase())
  );

  const togglePin = (roomId) => {
    const isCurrentlyPinned = pinnedRooms.includes(roomId);
    const next = isCurrentlyPinned ? pinnedRooms.filter(id => id !== roomId) : [...pinnedRooms, roomId];
    setPinnedRooms(next);
    localStorage.setItem('pinned_rooms', JSON.stringify(next));
    toast.success(isCurrentlyPinned ? 'Room unpinned' : 'Room pinned');
  };

  const toggleMute = (roomId) => {
    const isCurrentlyMuted = mutedRooms.includes(roomId);
    const next = isCurrentlyMuted ? mutedRooms.filter(id => id !== roomId) : [...mutedRooms, roomId];
    setMutedRooms(next);
    localStorage.setItem('muted_rooms', JSON.stringify(next));
    toast.success(isCurrentlyMuted ? 'Notifications unmuted' : 'Notifications muted');
  };

  const clearChat = () => {
    const cleared = JSON.parse(localStorage.getItem('global_cleared_at') || '{}');
    cleared[activeRoom?.id] = new Date().toISOString();
    localStorage.setItem('global_cleared_at', JSON.stringify(cleared));
    setMessages([]);
    setShowOptions(false);
    toast.error('Chat history cleared');
  };

  const handleTyping = ({ name, isTyping }) => {
    setTypers(prev => isTyping ? [...prev.filter(n => n !== name), name] : prev.filter(n => n !== name));
    if (isTyping) setTimeout(() => setTypers(prev => prev.filter(n => n !== name)), 3000);
  };

  const switchRoom = (room) => {
    if (socket && activeRoom) socket.emit('global:leave', activeRoom.id);
    setActiveRoom(room);
    setMessages([]);
    setShowOptions(false);
  };

  const exitRoom = () => {
    if (!activeRoom) return;
    const remaining = rooms.filter(r => r.id !== activeRoom.id);
    setRooms(remaining);
    setActiveRoom(remaining[0] || null);
    setShowOptions(false);
    setShowExitConfirm(false);
    toast.error(`Exited ${activeRoom.name}`);
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${activeRoom.name}"? This cannot be undone.`)) return;
    
    try {
      const res = await api.delete(`/global/rooms/${activeRoom.id}`);
      if (res.data.success) {
        toast.success('Room deleted successfully');
        const remaining = rooms.filter(r => r.id !== activeRoom.id);
        setRooms(remaining);
        setActiveRoom(remaining[0] || null);
        setShowOptions(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const sendMsg = async (overrideContent) => {
    const content = (overrideContent || input).trim();
    if (!content || !user || !activeRoom) return;
    if (!overrideContent) setInput('');
    
    const tempMsg = {
      _id: Date.now().toString(),
      content,
      sender: user,
      room: activeRoom.id,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    if (socket) {
      socket.emit('global:message', { room: activeRoom.id, content, senderId: user._id });
    } else {
      try {
        await api.post(`/global/${activeRoom.id}/messages`, { content });
      } catch {}
    }
  };

  const renderMessageContent = (content, createdAt) => {
    const clearedAt = JSON.parse(localStorage.getItem('global_cleared_at') || '{}')[activeRoom?.id];
    if (clearedAt && new Date(createdAt) < new Date(clearedAt)) return null;

    if (content.startsWith('{') && content.endsWith('}')) {
      try {
        const data = JSON.parse(content);
        if (data.type === 'poll') {
          return (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14, border: '1px solid var(--border2)', marginTop: 8, width: 240 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>📊 {data.question}</div>
              {data.options.map((opt, i) => (
                <button key={i} onClick={() => toast.success('Vote recorded!')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border2)', background: 'rgba(255,255,255,.05)', color: 'var(--text)', textAlign: 'left', marginBottom: 6, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}>
                  {opt.text}
                </button>
              ))}
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 4 }}>Anonymous Poll</div>
            </div>
          );
        }
        if (data.type === 'audio') {
          return (
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 14, border: '1px solid var(--border2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>🎤 Voice Message</div>
              <audio controls src={data.url} style={{ height: 32, width: '100%', maxWidth: 200 }} />
            </div>
          );
        }
      } catch (e) {}
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const isImage = (url) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url) || url.includes('tenor.com');
    const isVideo = (url) => /\.(mp4|webm|mov|mpeg)$/i.test(url);
    const isAudio = (url) => /\.(mp3|wav|ogg|mpeg|aac)$/i.test(url);

    return content.split(urlRegex).map((part, i) => {
      const trimmed = part.trim();
      if (trimmed.match(urlRegex)) {
        if (isImage(trimmed)) {
          return (
            <img 
              key={i} 
              src={trimmed} 
              alt="media" 
              style={{ maxWidth: '100%', borderRadius: 12, marginTop: 8, display: 'block', border: '1px solid var(--border2)' }} 
              onLoad={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          );
        }
        if (isVideo(trimmed)) {
          return (
            <video 
              key={i} 
              src={trimmed} 
              controls 
              style={{ maxWidth: '100%', borderRadius: 12, marginTop: 8, display: 'block', border: '1px solid var(--border2)' }} 
              onLoadedData={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          );
        }
        if (isAudio(trimmed)) {
          return (
            <audio 
              key={i} 
              src={trimmed} 
              controls 
              style={{ width: '100%', maxWidth: 240, marginTop: 8, display: 'block' }} 
            />
          );
        }
      }
      return part;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const isOwner = activeRoom?.createdBy === user?._id;
  const canInvite = activeRoom?.type === 'public' || isOwner;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      {showCreateRoom && (
        <CreateRoomModal 
          onClose={() => setShowCreateRoom(false)} 
          onCreate={(newRoom) => {
            setRooms(prev => [...prev, newRoom]);
            switchRoom(newRoom);
          }} 
        />
      )}

      {showInvite && (
        <InviteModal 
          room={activeRoom} 
          onClose={() => setShowInvite(false)} 
          socket={socket}
          sender={user}
        />
      )}

      {showPoll && (
        <PollModal 
          onClose={() => setShowPoll(false)} 
          onSubmit={(pollJson) => sendMsg(pollJson)}
        />
      )}

      {showRoomInfo && activeRoom && (
        <RoomInfoModal 
          room={activeRoom} 
          onClose={() => setShowRoomInfo(false)} 
        />
      )}

      {showMembers && activeRoom && (
        <MembersModal 
          room={activeRoom} 
          onClose={() => setShowMembers(false)} 
        />
      )}

      {showInvites && (
        <InvitationsModal 
          invites={invitations}
          onDecline={(inv) => removeInvitation(inv.roomId)}
          onAccept={async (inv) => {
            try {
              const res = await api.post(`/global/rooms/${inv.roomId}/join`);
              if (res.data.success) {
                removeInvitation(inv.roomId);
                const joinedRoom = res.data.room;
                setRooms(prev => {
                  if (prev.some(r => r.id === joinedRoom.id)) return prev;
                  return [joinedRoom, ...prev];
                });
                switchRoom(joinedRoom);
                toast.success(`Joined ${inv.roomName}!`);
              }
            } catch (err) {
              toast.error('Failed to join room');
            }
          }}
          onClose={() => setShowInvites(false)} 
        />
      )}

      {showExitConfirm && activeRoom && (
        <ExitConfirmModal 
          roomName={activeRoom.name}
          onConfirm={exitRoom}
          onClose={() => setShowExitConfirm(false)}
        />
      )}
      
      
      <div style={{ width: 260, background: 'var(--bg-card2)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>🌐 Rooms</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
               <div onClick={() => setShowInvites(true)} style={{ position: 'relative', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  🔔
                  {invitations.length > 0 && <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 6, padding: '1px 4px', border: '1.5px solid var(--bg-card2)' }}>{invitations.length}</div>}
               </div>
               <button onClick={() => setShowCreateRoom(true)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,201,177,.15)', border: 'none', color: 'var(--teal)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➕</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Join a public room</div>
        </div>
          <div style={{ padding: '10px 0', marginTop: 12 }}>
             <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, opacity: 0.5 }}>🔍</span>
                <input 
                  value={roomQuery} 
                  onChange={e => setRoomQuery(e.target.value)} 
                  placeholder="Search rooms..." 
                  style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 10px 8px 30px', color: 'var(--text)', fontSize: 13, outline: 'none' }} 
                />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {sortedRooms.map(room => {
            const active = activeRoom?.id === room.id;
            const isPinned = pinnedRooms.includes(room.id);
            return (
              <div key={room.id} onClick={() => switchRoom(room)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px',
                  borderRadius: 14, cursor: 'pointer', marginBottom: 2, transition: 'all .2s',
                  background: active ? 'var(--teal-glow)' : 'transparent',
                  border: active ? '1px solid rgba(0,201,177,0.2)' : '1px solid transparent',
                  position: 'relative'
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {room.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {room.name}
                    {isPinned && <span style={{ fontSize: 10 }}>📌</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>👥 {(room.membersCount || 0).toLocaleString()} online</div>
                </div>
                {mutedRooms.includes(room.id) && <span style={{ fontSize: 12, opacity: 0.6 }}>🔕</span>}
              </div>
            );
          })}
        </div>
      </div>
 
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', overflow: 'hidden' }}>
        
        <div style={{ padding: '14px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeRoom && (
            <>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {activeRoom.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{activeRoom.name}</div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>👥 {(activeRoom.membersCount || 0).toLocaleString()} online</div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button onClick={() => setShowSearch(p => !p)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', color: showSearch ? 'var(--teal)' : 'var(--text-dim)', fontSize: 14, cursor: 'pointer', transition: 'all .25s' }}>🔍</button>
            <button onClick={() => activeRoom && toggleMute(activeRoom.id)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', color: activeRoom && mutedRooms.includes(activeRoom.id) ? 'var(--red)' : 'var(--text-dim)', fontSize: 14, cursor: 'pointer', transition: 'all .25s' }}>{activeRoom && mutedRooms.includes(activeRoom.id) ? '🔕' : '🔔'}</button>
            <button onClick={() => setShowOptions(p => !p)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer', transition: 'all .25s' }}>⋯</button>
            
            {showOptions && activeRoom && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border2)',
                borderRadius: 14, width: 220, zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px',
                animation: 'pickerUp 0.15s ease-out'
              }}>
                 {canInvite && <div onClick={() => { setShowOptions(false); setShowInvite(true); }} style={dropItemStyle}>🙌 Invite People</div>}
                 <div onClick={() => { setShowOptions(false); togglePin(activeRoom.id); }} style={dropItemStyle}>
                   {pinnedRooms.includes(activeRoom.id) ? '📍 Unpin Room' : '📌 Pin Room'}
                 </div>
                 <div onClick={() => { setShowOptions(false); setShowRoomInfo(true); }} style={dropItemStyle}>ℹ️ Room Info</div>
                 <div onClick={() => { setShowOptions(false); setShowMembers(true); }} style={dropItemStyle}>👥 View Members</div>
                 <div style={{ height: 1, background: 'var(--border2)', margin: '4px 0' }} />
                 <div onClick={clearChat} style={{ ...dropItemStyle, color: 'var(--red)' }}>🗑️ Clear Chat (Local)</div>
                 {!isOwner && <div onClick={() => { setShowOptions(false); setShowExitConfirm(true); }} style={{ ...dropItemStyle, color: 'var(--red)' }}>🚪 Exit Room</div>}
                 {isOwner && <div onClick={handleDeleteRoom} style={{ ...dropItemStyle, color: 'var(--red)', fontWeight: 700 }}>🗑️ DELETE ROOM</div>}
              </div>
            )}
          </div>
        </div>

        {showSearch && (
          <div style={{ padding: '0 20px 10px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border2)' }}>
            <input 
              autoFocus
              value={msgSearchQuery}
              onChange={e => setMsgSearchQuery(e.target.value)}
              placeholder="Search messages in this room..."
              style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>
        )}

        
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: 'linear-gradient(90deg,rgba(0,201,177,.1),rgba(26,140,255,.1))', borderLeft: '3px solid var(--teal)', borderRadius: '0 10px 10px 0', fontSize: 13, color: 'var(--text-dim)' }}>
          Welcome to <strong style={{ color: 'var(--teal)' }}>{activeRoom?.name || 'Global Chat'}</strong> — Be respectful & have fun! 🌍
        </div>

        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}
          {filteredMessages.map((msg, i) => {
            const isMe = msg.sender?._id === user._id;
            return (
              <div key={msg._id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <Avatar name={msg.sender?.name || '?'} src={msg.sender?.avatar} size={32} gradient={`${msg.sender?.avatarColor || 'var(--purple)'},var(--blue)`} />
                <div style={{ maxWidth: '70%' }}>
                  {!isMe && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>{msg.sender?.name}</div>}
                  <div style={{
                    padding: '10px 14px', borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isMe ? 'linear-gradient(135deg,var(--teal),var(--teal-dim))' : 'var(--bg-card2)',
                    color: isMe ? '#000' : 'var(--text)', fontSize: 14, lineHeight: 1.5,
                  }}>
                    {renderMessageContent(msg.content, msg.createdAt)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {typers.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
          <div ref={endRef} />
        </div>

        
        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['📸 Photo', '📎 File', '📊 Poll', '🎤 Voice'].map(b => (
              <button key={b} onClick={() => handleFeatureClick(b)} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}>{b}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 4 }}>
               <button onClick={() => !isRecording && setShowPicker(p => !p)} style={{ ...actionBtnStyle, opacity: isRecording ? 0.3 : 1 }}>🙂</button>
               <input 
                 type="file" 
                 hidden 
                 ref={fileInputRef} 
                 onChange={handleFileChange}
                 accept="image/*,video/*,audio/*,application/pdf,text/plain"
               />
            </div>

            {showPicker && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 12, zIndex: 100, maxWidth: 'calc(100vw - 40px)' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border2)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', width: 350, maxWidth: '100%' }}>
                   <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)' }}>
                      <button onClick={() => setPickerTab('emoji')} style={{ flex: 1, padding: '12px', background: 'rgba(0,201,177,.08)', border: 'none', color: 'var(--teal)', cursor: 'default', fontWeight: 600, fontSize: 13 }}>Emoji Picker</button>
                   </div>
                   
                   <EmojiPicker 
                     theme="dark"
                     onEmojiClick={(ed) => {
                       setInput(p => p + ed.emoji);
                       setShowPicker(false);
                     }}
                     width="100%"
                     height={380}
                   />
                 </div>
              </div>
            )}

            {isRecording ? (
              <div onClick={stopRecording} style={{ flex: 1, background: 'rgba(255,0,0,0.1)', border: '1.5px solid var(--red)', borderRadius: 14, padding: '12px 16px', color: 'var(--red)', fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer', animation: 'pulse 1.5s infinite' }}>
                🔴 Recording... Tap to Stop & Send
              </div>
            ) : (
              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  if (socket && activeRoom) socket.emit('global:typing', { room: activeRoom.id, name: user.name, isTyping: true });
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Share something in ${activeRoom?.name || 'this room'}…`}
                rows={1}
                style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: '12px 16px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', maxHeight: 120, transition: 'border .2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            )}
            <button onClick={() => sendMsg()} disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: input.trim() ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'rgba(255,255,255,.06)', color: input.trim() ? '#fff' : 'var(--text-dim)', fontSize: 18, flexShrink: 0, transition: 'all .2s', transform: input.trim() ? 'scale(1.05)' : 'scale(1)' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
const dropItemStyle = {
  padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
  transition: 'background .2s', display: 'flex', alignItems: 'center', gap: 8,
  color: 'var(--text)',
};

const actionBtnStyle = {
  width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.06)',
  border: '1px solid var(--border2)', color: 'var(--text-dim)', fontSize: 16,
  cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center',
  justifyContent: 'center'
};
