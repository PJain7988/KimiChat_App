import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';
import ContactProfile from './ContactProfile';
import { toast } from 'react-hot-toast';
import { getChatOtherUser } from '../../utils/idUtils';

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, messages, sendMessage } = useChatStore();
  
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeChat?._id]?.length, activeChat?._id]);

  const getOtherUser = (chat) => getChatOtherUser(chat, user?._id);
  const getChatName = (chat) => chat?.isGroup ? chat.name : (getOtherUser(chat)?.name || 'Kimi User');
  
  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      await sendMessage(activeChat._id, input.trim());
      setInput('');
    } catch (err) {
      toast.error('Failed to send');
    }
  };

  const activeMsgs = messages[activeChat?._id] || [];

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden relative bg-[#050d1a]">
      {/* Sidebar - Hidden on mobile if chatting */}
      <div className={`
        w-full md:w-[320px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]
        ${activeChat ? 'hidden md:flex' : 'flex'}
      `}>
        <ChatList />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col h-full min-w-0 overflow-hidden relative
        ${activeChat ? 'flex' : 'hidden md:flex'}
      `}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4 animate-fade-in">
             <div className="w-20 h-20 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-[rgba(0,201,177,0.2)]">💬</div>
             <h2 className="text-xl font-bold text-[var(--text)]">KimiChat</h2>
             <p className="text-sm">Select a conversation to start</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* STICKY HEADER */}
            <header className="h-[72px] shrink-0 sticky top-0 z-50 bg-[#0a1628]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.07)] px-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 -ml-2 text-[var(--teal)] hover:bg-[rgba(0,201,177,0.1)] rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfile(true)}>
                <Avatar name={getChatName(activeChat)} src={activeChat.avatar} size={42} online={activeChat.isAI || getOtherUser(activeChat)?.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold truncate text-[var(--text)] text-sm md:text-base">{getChatName(activeChat)}</div>
                  <div className="text-[10px] md:text-xs text-[var(--green)]">Online</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)]">📞</button>
                <button className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)]">📹</button>
              </div>
            </header>

            {/* MESSAGES LIST */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {activeMsgs.map((msg, i) => (
                <MessageBubble 
                  key={msg._id || i} 
                  message={msg}
                  isMe={msg.sender?._id === user?._id || msg.sender === user?._id}
                />
              ))}
            </div>

            {/* INPUT AREA */}
            <footer className="shrink-0 p-4 bg-[#0a1628] border-t border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center gap-3">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--teal)] transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-xl bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white flex items-center justify-center shadow-lg shadow-[rgba(0,201,177,0.2)] disabled:opacity-50"
                >
                  ➤
                </button>
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