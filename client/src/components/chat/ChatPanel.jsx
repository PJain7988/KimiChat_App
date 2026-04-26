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

const EMOJI_CATEGORIES = [
  { id: 'smileys', label: '😊', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰'] },
  { id: 'animals', label: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷'] },
];

const STICKER_PACKS = [
  { id: 'reactions', label: '🎭', stickers: [{id:'s1', emoji:'😂', label:'LOL', bg:'#FFE566'}, {id:'s2', emoji:'😍', label:'LOVE', bg:'#FFB3C1'}] }
];

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, messages, sendMessage, typingStatus } = useChatStore();
  
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const getOtherUser = (chat) => getChatOtherUser(chat, user?._id);
  const getChatName = (chat) => chat?.isGroup ? chat.name : (getOtherUser(chat)?.name || 'Kimi User');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeChat?._id]?.length, activeChat?._id]);

  const handleSend = async (customContent = null) => {
    const content = customContent || input.trim();
    if (!content || !activeChat) return;
    try {
      await sendMessage(activeChat._id, content);
      if (!customContent) setInput('');
      setShowPicker(false);
    } catch (err) {}
  };

  const handleEmoji = (em) => setInput(prev => prev + em);
  const handleSticker = (s) => handleSend(`[sticker:${s.emoji}:${s.label}]`);

  const activeMsgs = messages[activeChat?._id] || [];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className={`w-full md:w-[320px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628] ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatList />
      </div>

      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#050d1a] ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-[24px] flex items-center justify-center text-4xl shadow-xl shadow-[rgba(0,201,177,0.2)]">💬</div>
            <h2 className="text-xl font-bold">Select a conversation</h2>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <header className="h-[72px] shrink-0 sticky top-0 z-10 px-4 flex items-center gap-3 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)]">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-[var(--teal)]">←</button>
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfile(true)}>
                <Avatar name={getChatName(activeChat)} src={activeChat.avatar} size={42} online={activeChat.isAI || getOtherUser(activeChat)?.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold truncate">{getChatName(activeChat)}</div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest">{activeChat.isAI ? 'Always Online 🤖' : 'Online'}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <HeaderBtn icon="📞" onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} />
                <HeaderBtn icon="📹" onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} />
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMsgs.map((msg, i) => (
                <MessageBubble key={msg._id || i} message={msg} isMe={msg.sender?._id === user?._id || msg.sender === user?._id} />
              ))}
            </div>

            <footer className="shrink-0 p-4 bg-[#0a1628] border-t border-[rgba(255,255,255,0.07)] relative">
              {showPicker && (
                <div className="absolute bottom-full left-4 mb-4 w-72 bg-[#1e3050] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 shadow-2xl animate-modal-in z-50">
                   <div className="flex gap-4 mb-4 border-b border-white/5 pb-2">
                      <button className="text-xs font-bold text-[var(--teal)]">Emojis</button>
                      <button className="text-xs font-bold text-[var(--text-dim)]">Stickers</button>
                   </div>
                   <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {EMOJI_CATEGORIES[0].emojis.map(e => (
                        <button key={e} onClick={() => handleEmoji(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                      ))}
                   </div>
                </div>
              )}
              
              <div className="flex items-end gap-3">
                <button onClick={() => setShowPicker(!showPicker)} className="p-3 text-[var(--text-dim)] hover:text-[var(--teal)] transition-all">😊</button>
                <div className="flex-1 bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-xl flex items-end px-4 py-1 focus-within:border-[var(--teal)] transition-all">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent py-2.5 text-sm text-[var(--text)] outline-none resize-none max-h-32"
                    rows={1}
                  />
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-[var(--teal)] text-black' : 'bg-[#0d1f35] text-[var(--text-dim)] opacity-50'}`}
                >➤</button>
              </div>
            </footer>
          </div>
        )}
      </div>

      {showProfile && activeChat && (
        <ContactProfile chat={activeChat} contact={getOtherUser(activeChat)} onClose={() => setShowProfile(false)} messages={activeMsgs} />
      )}
    </div>
  );
}

function HeaderBtn({ icon, onClick }) {
  return (
    <button onClick={onClick} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 text-[var(--text-dim)] hover:text-[var(--teal)] transition-all">{icon}</button>
  );
}