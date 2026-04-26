import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { toast } from 'sonner';

export default function ContactProfile({ contact, chat, onClose, messages = [] }) {
  if (!contact && !chat) return null;

  const isGroup = chat?.isGroup;
  const isAI = chat?.isAI;
  const name = isAI ? 'Kimi AI' : (isGroup ? chat.name : contact?.name);
  const avatar = isAI ? null : (isGroup ? chat.avatar : contact?.avatar);
  const isOnline = isAI ? true : (isGroup ? false : contact?.isOnline);
  const bio = isAI ? 'Your personal AI assistant, here to help 24/7!' : (contact?.bio || 'Hey there! I am using KimiChat.');

  const [mutedChats, setMutedChats] = useState(() => JSON.parse(localStorage.getItem('kc_muted_chats') || '[]'));
  const [blockedUsers, setBlockedUsers] = useState(() => JSON.parse(localStorage.getItem('kc_blocked_users') || '[]'));
  const [showMedia, setShowMedia] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [disappearingValue, setDisappearingValue] = useState(() => JSON.parse(localStorage.getItem('kc_disappearing_chats') || '{}')[chat?._id] || 'Off');

  const chatMedia = messages.filter(m => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return m.content?.match(urlRegex) && /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(m.content);
  });

  return (
    <div className="w-80 h-full bg-[#0a1628] border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-y-auto shrink-0 z-20 animate-modal-in shadow-2xl">
      {/* Header */}
      <div className="h-[72px] px-6 flex items-center gap-4 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] sticky top-0 z-10 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-[var(--text-dim)] hover:text-white transition-colors">✕</button>
        <span className="font-bold text-sm uppercase tracking-widest">Contact Info</span>
      </div>

      {/* Main Info */}
      <div className="p-8 flex flex-col items-center bg-[#0d1f35] border-b-8 border-[#050d1a]">
        <Avatar src={avatar} name={name} size={140} online={isOnline} gradient={isAI ? 'var(--teal),var(--blue)' : null} />
        <div className="mt-6 text-2xl font-bold text-center">{name}</div>
        {!isGroup && !isAI && contact?.username && <div className="text-[var(--text-dim)] mt-1 text-sm">@{contact.username}</div>}
        {isAI && <div className="text-[var(--teal)] mt-1 text-xs font-bold uppercase tracking-widest">AI Assistant</div>}
      </div>

      {/* About Section */}
      <div className="p-6 border-b-8 border-[#050d1a] space-y-2">
        <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">About</h3>
        <p className="text-sm leading-relaxed">{bio}</p>
      </div>

      {/* Participants (Groups Only) */}
      {isGroup && (
        <div className="p-6 border-b-8 border-[#050d1a] space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Participants ({chat.participants?.length || 0})</h3>
          <div className="space-y-3">
            {chat.participants?.map(p => (
              <div key={p._id} className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatar} size={36} online={p.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-[10px] text-[var(--text-dim)] truncate">{p.bio || 'Available'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media & Settings */}
      <div className="p-2 border-b-8 border-[#050d1a]">
        <button 
          onClick={() => setShowMedia(!showMedia)}
          className="w-full flex items-center justify-between p-4 hover:bg-[rgba(255,255,255,0.03)] rounded-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-xl">🖼️</span>
            <span className="text-sm font-bold">Media, links, and docs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-dim)]">{chatMedia.length}</span>
            <span className={`text-[var(--text-dim)] transition-transform ${showMedia ? 'rotate-90' : ''}`}>›</span>
          </div>
        </button>
        {showMedia && (
          <div className="p-4 grid grid-cols-3 gap-2">
            {chatMedia.length > 0 ? chatMedia.map((m, i) => (
              <img key={i} src={m.content} alt="media" className="w-full aspect-square object-cover rounded-lg border border-[rgba(255,255,255,0.1)]" />
            )) : (
              <div className="col-span-3 text-center py-4 text-xs text-[var(--text-dim)]">No shared media</div>
            )}
          </div>
        )}

        <button className="w-full flex items-center gap-4 p-4 hover:bg-[rgba(255,255,255,0.03)] rounded-xl transition-all">
          <span className="text-xl">⭐</span>
          <span className="text-sm font-bold">Starred messages</span>
        </button>

        <button className="w-full flex items-center gap-4 p-4 hover:bg-[rgba(255,255,255,0.03)] rounded-xl transition-all">
          <span className="text-xl">⏱️</span>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold">Disappearing messages</div>
            <div className="text-[10px] text-[var(--text-dim)]">{disappearingValue}</div>
          </div>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="p-2">
        <button className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
          <span className="text-xl">🚫</span>
          <span className="text-sm font-bold">Block {isGroup ? 'Group' : 'Contact'}</span>
        </button>
        <button className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
          <span className="text-xl">👎</span>
          <span className="text-sm font-bold">Report {isGroup ? 'Group' : 'Contact'}</span>
        </button>
      </div>
    </div>
  );
}
