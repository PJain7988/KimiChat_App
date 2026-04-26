import React, { useState, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import { toast } from 'sonner';

export default function ContactProfile({ contact, chat, onClose, messages = [] }) {
  if (!contact && !chat) return null;

  const isGroup = chat?.isGroup;
  // If it's Kimi AI
  const isAI = chat?.isAI;
  
  const name = isAI ? 'Kimi AI' : (isGroup ? chat.name : contact?.name);
  const avatar = isAI ? null : (isGroup ? chat.avatar : contact?.avatar);
  const isOnline = isAI ? true : (isGroup ? false : contact?.isOnline);
  const bio = isAI ? 'Your personal AI assistant, here to help 24/7!' : (contact?.bio || 'Hey there! I am using KimiChat.');

  // States for management
  const [mutedChats, setMutedChats] = useState(() => JSON.parse(localStorage.getItem('kc_muted_chats') || '[]'));
  const [blockedUsers, setBlockedUsers] = useState(() => JSON.parse(localStorage.getItem('kc_blocked_users') || '[]'));
  const [showMedia, setShowMedia] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [disappearingValue, setDisappearingValue] = useState(() => JSON.parse(localStorage.getItem('kc_disappearing_chats') || '{}')[chat?._id] || 'Off');

  const toggleMute = () => {
    const id = chat?._id;
    if (!id) return;
    const isMuted = mutedChats.includes(id);
    const next = isMuted ? mutedChats.filter(x => x !== id) : [...mutedChats, id];
    setMutedChats(next);
    localStorage.setItem('kc_muted_chats', JSON.stringify(next));
    toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
  };

  const toggleBlock = () => {
    const id = contact?._id;
    if (!id) return;
    const isBlocked = blockedUsers.includes(id);
    const next = isBlocked ? blockedUsers.filter(x => x !== id) : [...blockedUsers, id];
    setBlockedUsers(next);
    localStorage.setItem('kc_blocked_users', JSON.stringify(next));
    toast.error(isBlocked ? `${name} unblocked` : `${name} blocked`);
  };

  const chatMedia = messages.filter(m => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const isImage = (url) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url) || url.includes('tenor.com');
    return m.content?.match(urlRegex) && isImage(m.content);
  });

  return (
    <div style={{
      width: 320, background: 'var(--bg-card)', borderLeft: '1px solid var(--border2)',
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
      animation: 'slideInRight 0.25s ease-out', flexShrink: 0,
    }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .cp-item { padding: 14px 20px; transition: background 0.2s; cursor: pointer; display: flex; align-items: center; gap: 16px; }
        .cp-item:hover { background: rgba(255,255,255,0.04); }
        .cp-section { border-bottom: 8px solid var(--bg-dark); }
      `}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', borderBottom: '1px solid var(--border2)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Contact Info</span>
      </div>

      {/* Info */}
      <div className="cp-section" style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar src={avatar} name={name} size={140} online={isOnline} emoji={isAI ? '🤖' : null} gradient={isAI ? 'var(--teal),var(--blue)' : null} />
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 700, textAlign: 'center' }}>{name}</div>
        {!isGroup && !isAI && contact?.username && <div style={{ color: 'var(--text-dim)', marginTop: 4, fontSize: 15 }}>@{contact.username}</div>}
        {isAI && <div style={{ color: 'var(--teal)', marginTop: 4, fontSize: 14 }}>AI Assistant</div>}
      </div>

      {(!isGroup || isAI) && (
        <div className="cp-section" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>About</div>
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>{bio}</div>
        </div>
      )}

      {isGroup && (
        <div className="cp-section" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Group Description</div>
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>{chat.description || 'Welcome to the group!'}</div>
          
          <div style={{ marginTop: 20, color: 'var(--text-dim)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Participants ({chat.participants?.length || 0})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
             {chat.participants?.map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <Avatar name={p.name} src={p.avatar} size={36} online={p.isOnline} />
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                     <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.bio || 'Available'}</div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Media, links, docs */}
      {!isAI && (
        <div className="cp-section">
           <div className="cp-item" onClick={() => setShowMedia(p => !p)}>
              <span style={{ fontSize: 20, opacity: 0.8 }}>🖼️</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Media, links, and docs</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{chatMedia.length}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 18, transform: showMedia ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</span>
              </div>
           </div>
           {showMedia && (
             <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
               {chatMedia.length > 0 ? chatMedia.map((m, i) => (
                 <img key={i} src={m.content} alt="media" style={{ width: '100%', aspectRatio: '1', borderRadius: 8, objectFit: 'cover' }} />
               )) : (
                 <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: '10px 0' }}>No media found</div>
               )}
             </div>
           )}
        </div>
      )}

      {/* Actions */}
      {!isAI && (
        <div className="cp-section" style={{ padding: '8px 0' }}>
           <div className="cp-item" onClick={() => toast.success('Starred messages feature active! No messages starred yet.')}>
              <span style={{ fontSize: 20, opacity: 0.8 }}>⭐</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Starred messages</div>
           </div>
           <div className="cp-item" onClick={toggleMute}>
              <span style={{ fontSize: 20, opacity: 0.8 }}>{mutedChats.includes(chat?._id) ? '🔕' : '🔔'}</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>
                {mutedChats.includes(chat?._id) ? 'Unmute notifications' : 'Mute notifications'}
              </div>
           </div>
           <div className="cp-item" onClick={() => setShowDisappearing(p => !p)}>
              <span style={{ fontSize: 20, opacity: 0.8 }}>⏱️</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Disappearing messages</div>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{disappearingValue}</span>
           </div>
           {showDisappearing && (
             <div style={{ padding: '0 20px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
               {['Off', '24 Hours', '7 Days', '90 Days'].map(v => (
                 <button key={v} onClick={() => {
                   setDisappearingValue(v);
                   const current = JSON.parse(localStorage.getItem('kc_disappearing_chats') || '{}');
                   current[chat?._id] = v;
                   localStorage.setItem('kc_disappearing_chats', JSON.stringify(current));
                   toast.success(`Disappearing messages set to ${v}`);
                   setShowDisappearing(false);
                 }} style={{
                   padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border2)',
                   background: disappearingValue === v ? 'rgba(0,201,177,0.1)' : 'transparent',
                   color: disappearingValue === v ? 'var(--teal)' : 'var(--text-dim)',
                   fontSize: 12, cursor: 'pointer', transition: '0.2s',
                   borderColor: disappearingValue === v ? 'var(--teal)' : 'var(--border2)'
                 }}>{v}</button>
               ))}
             </div>
           )}
        </div>
      )}

      {/* Danger zone */}
      {!isAI && (
        <div className="cp-section" style={{ padding: '8px 0', borderBottom: 'none' }}>
          {!isGroup && (
            <div className="cp-item" style={{ color: '#ff4444' }} onClick={toggleBlock}>
              <span style={{ fontSize: 20 }}>🚫</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>
                {blockedUsers.includes(contact?._id) ? `Unblock ${name}` : `Block ${name}`}
              </div>
            </div>
          )}
          <div className="cp-item" style={{ color: '#ff4444' }} onClick={() => toast.success(`Report submitted for ${name}`)}>
            <span style={{ fontSize: 20 }}>👎</span>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Report {isGroup ? 'group' : 'contact'}</div>
          </div>
          {isGroup && (
            <div className="cp-item" style={{ color: '#ff4444' }} onClick={() => toast.success('You have exited the group.')}>
              <span style={{ fontSize: 20 }}>🚪</span>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Exit group</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
