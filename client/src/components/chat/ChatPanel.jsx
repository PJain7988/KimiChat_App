import React, { useState, useEffect, useRef } from 'react';
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

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { 
    chats, activeChat, setActiveChat, messages, 
    sendMessage, fetchMessages 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const getOtherUser = (chat) => getChatOtherUser(chat, user?._id);
  const getChatName = (chat) => chat?.isGroup ? chat.name : (getOtherUser(chat)?.name || 'Kimi User');
  const getChatStatus = (chat) => {
    if (chat?.isAI) return 'Always Online 🤖';
    const other = getOtherUser(chat);
    return other?.isOnline ? 'Online' : 'Offline';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeChat?._id]?.length, activeChat?._id]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      await sendMessage(activeChat._id, input.trim());
      setInput('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Chat List Column */}
      <div className={`
        w-full md:w-[320px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]
        ${activeChat ? 'hidden md:flex' : 'flex'}
      `}>
        <ChatList />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col h-full min-w-0 overflow-hidden chat-bg
        ${activeChat ? 'flex' : 'hidden md:flex'}
      `}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)] gap-4 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-[24px] flex items-center justify-center text-4xl shadow-xl shadow-[rgba(0,201,177,0.2)]">💬</div>
            <h2 className="text-xl font-bold text-[var(--text)] font-display">Select a conversation</h2>
            <p className="text-sm">Choose a chat to start messaging</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full relative">
            {/* Header */}
            <header className="h-[72px] shrink-0 px-4 md:px-6 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] flex items-center gap-3 z-20">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 -ml-2 text-[var(--teal)] hover:bg-[rgba(0,201,177,0.1)] rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setShowProfile(true)}>
                <Avatar name={getChatName(activeChat)} src={activeChat.avatar} size={42} online={activeChat.isAI || getOtherUser(activeChat)?.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold truncate text-[var(--text)] font-display">{getChatName(activeChat)}</div>
                  <div className={`text-xs ${getOtherUser(activeChat)?.isOnline || activeChat.isAI ? 'text-[var(--green)]' : 'text-[var(--text-dim)]'}`}>
                    {getChatStatus(activeChat)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors text-xl">📞</button>
                <button onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} className="p-2 text-[var(--text-dim)] hover:text-[var(--teal)] transition-colors text-xl">📹</button>
              </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-area">
              {messages[activeChat._id]?.map((msg, i) => (
                <MessageBubble 
                  key={msg._id || i} 
                  message={msg}
                  isMe={msg.sender?._id === user?._id || msg.sender === user?._id}
                />
              ))}
            </div>

            {/* Input */}
            <footer className="p-3 md:p-4 bg-[#0a1628] border-t border-[rgba(255,255,255,0.07)] shrink-0">
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
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() ? 'bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white shadow-lg' : 'bg-[#0d1f35] text-[var(--text-dim)] opacity-50'
                  }`}
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