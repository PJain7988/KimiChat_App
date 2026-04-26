import React, { useState, useEffect, useRef, useCallback } from 'react';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';
import ContactProfile from './ContactProfile';
import { toast } from 'react-hot-toast';
import { getChatOtherUser } from '../../utils/idUtils';

// --- CONSTANTS ---
const EMOJI_CATEGORIES = [
  { id: 'smileys', label: '😊', title: 'Smileys & People', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥸', '🤠', '🥺', '👻', '💀', '☠️', '👽', '🤖'] },
  { id: 'gestures', label: '👋', title: 'Gestures & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '👀', '👁️', '👅', '👄'] },
  { id: 'animals', label: '🐶', title: 'Animals & Nature', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐆', '🐅', '🦓', '🦍', '🦧'] }
];

const STICKER_PACKS = [
  {
    id: 'reactions', label: '🎭', title: 'Reactions',
    stickers: [
      { id: 's1', emoji: '😂', label: 'LOL', bg: '#FFE566' },
      { id: 's2', emoji: '😍', label: 'Love it!', bg: '#FFB3C1' },
      { id: 's3', emoji: '🔥', label: 'Fire!', bg: '#FF7043' },
      { id: 's4', emoji: '💯', label: '100%', bg: '#69F0AE' },
      { id: 's5', emoji: '👏', label: 'Clap!', bg: '#B39DDB' },
      { id: 's6', emoji: '🤯', label: 'Mind blown', bg: '#F48FB1' }
    ]
  }
];

// --- SUB-COMPONENTS ---
function MediaPicker({ onEmoji, onSticker, onClose }) {
  const [tab, setTab] = useState('emoji');
  return (
    <div className="absolute bottom-20 left-4 w-72 bg-[#0a1628] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
      <div className="flex border-b border-[rgba(255,255,255,0.1)]">
        <button onClick={() => setTab('emoji')} className={`flex-1 p-3 text-sm font-bold ${tab === 'emoji' ? 'text-[var(--teal)] border-b-2 border-[var(--teal)]' : 'text-[var(--text-dim)]'}`}>Emojis</button>
        <button onClick={() => setTab('sticker')} className={`flex-1 p-3 text-sm font-bold ${tab === 'sticker' ? 'text-[var(--teal)] border-b-2 border-[var(--teal)]' : 'text-[var(--text-dim)]'}`}>Stickers</button>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto grid grid-cols-6 gap-2">
        {tab === 'emoji' ? (
          EMOJI_CATEGORIES[0].emojis.map(e => <button key={e} onClick={() => onEmoji(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>)
        ) : (
          STICKER_PACKS[0].stickers.map(s => <button key={s.id} onClick={() => onSticker(s)} className="text-2xl p-2 rounded-lg hover:bg-white/10">{s.emoji}</button>)
        )}
      </div>
    </div>
  );
}

function ToolBtn({ icon, title, onClick, active }) {
  return (
    <button 
      title={title} 
      onClick={onClick} 
      className={`p-2 rounded-lg border transition-all flex items-center justify-center text-lg
        ${active ? 'bg-[rgba(0,201,177,0.15)] border-[var(--teal)] text-[var(--teal)]' : 'bg-white/5 border-transparent text-[var(--text-dim)] hover:border-[var(--teal)]'}
      `}
    >
      {icon}
    </button>
  );
}

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { 
    activeChat, setActiveChat, messages, 
    sendMessage, fetchMessages, typingStatus 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const socket = getSocket();

  const getOtherUser = (chat) => getChatOtherUser(chat, user?._id);
  const getChatName = (chat) => chat?.isGroup ? chat.name : (getOtherUser(chat)?.name || 'Kimi User');
  
  // Join socket room and fetch history
  useEffect(() => {
    if (activeChat?._id) {
      fetchMessages(activeChat._id);
      if (socket) {
        socket.emit('chat:join', activeChat._id);
        return () => socket.emit('chat:leave', activeChat._id);
      }
    }
  }, [activeChat?._id, fetchMessages, socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeChat?._id]?.length, activeChat?._id]);

  const handleSend = async (custom) => {
    const content = custom || input.trim();
    if (!content || !activeChat) return;
    try {
      await sendMessage(activeChat._id, content);
      setInput('');
      setShowPicker(false);
    } catch (err) { toast.error('Failed to send'); }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className={`w-full md:w-[320px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628] ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatList />
      </div>

      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden chat-bg ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-6 animate-fade-in">
            {!logoErr ? (
              <img 
                src="/images/logo.png" 
                alt="KimiChat" 
                onError={() => setLogoErr(true)} 
                className="w-20 h-20 rounded-[24px] object-contain"
                style={{ filter: 'drop-shadow(0 0 18px rgba(0,201,177,.45))' }}
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-[24px] flex items-center justify-center text-4xl shadow-xl shadow-[rgba(0,201,177,0.2)]">💬</div>
            )}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text)] font-display mb-2">Welcome to KimiChat</h2>
              <p className="text-sm opacity-70">Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full relative">
            <header className="h-[72px] shrink-0 px-4 md:px-6 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] flex items-center gap-3 z-20">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-[var(--teal)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfile(true)}>
                <Avatar name={getChatName(activeChat)} src={activeChat.avatar} size={42} online={activeChat.isAI || getOtherUser(activeChat)?.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold truncate text-[var(--text)] font-display">{getChatName(activeChat)}</div>
                  <div className="text-xs text-[var(--text-dim)]">{activeChat.isAI ? 'Always Online' : (getOtherUser(activeChat)?.isOnline ? 'Online' : 'Offline')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors text-xl">📞</button>
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors text-xl">📹</button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-area">
              {messages[activeChat._id]?.map((msg, i) => (
                <MessageBubble key={msg._id || i} message={msg} isMe={msg.sender?._id === user?._id || msg.sender === user?._id} />
              ))}
            </div>

            <footer className="p-3 md:p-4 bg-[#0a1628] border-t border-[rgba(255,255,255,0.07)] shrink-0 relative">
              {showPicker && <MediaPicker onEmoji={(em) => setInput(prev => prev + em)} onSticker={(s) => handleSend(`[sticker:${s.id}]`)} onClose={() => setShowPicker(false)} />}
              
              <div className="flex gap-2 mb-3">
                <ToolBtn icon="😊" title="Emoji" onClick={() => setShowPicker(!showPicker)} active={showPicker} />
                <ToolBtn icon="📎" title="Attach" onClick={() => {}} />
                <ToolBtn icon="🎤" title="Voice" onClick={() => {}} />
              </div>

              <div className="flex items-end gap-3 max-w-5xl mx-auto">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--teal)] transition-colors resize-none max-h-32"
                  rows={1}
                />
                <button onClick={() => handleSend()} disabled={!input.trim()} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white shadow-lg shadow-[rgba(0,201,177,0.3)]' : 'bg-[#0d1f35] text-[var(--text-dim)] opacity-50'}`}>➤</button>
              </div>
            </footer>
          </div>
        )}
      </div>

      {showProfile && activeChat && (
        <ContactProfile chat={activeChat} contact={getOtherUser(activeChat)} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}