import React, { useState, useEffect, useRef, useCallback } from 'react';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';

export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { chats, activeChat, messages, typing, fetchChats, fetchMessages, sendMessage, setActiveChat } = useChatStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const socket = getSocket();

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (activeChat?._id) fetchMessages(activeChat._id);
  }, [activeChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[activeChat?._id]]);

  const handleTyping = useCallback((e) => {
    setInput(e.target.value);
    if (!socket || !activeChat) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('message:typing', { chatId: activeChat._id, isTyping: true });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('message:typing', { chatId: activeChat._id, isTyping: false });
    }, 1500);
  }, [isTyping, activeChat, socket]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeChat) return;
    const content = input.trim();
    setInput('');
    if (socket) socket.emit('message:typing', { chatId: activeChat._id, isTyping: false });
    await sendMessage({ chatId: activeChat._id, senderId: user._id, content });
  }, [input, activeChat, user, socket, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const chatMessages = messages[activeChat?._id] || [];
  const typingUsers = (typing[activeChat?._id] || []).filter(t => t.userId !== user._id);

  const getOtherUser = (chat) => {
    if (!chat || chat.isGroup || chat.isAI) return null;
    return chat.participants?.find(p => p._id !== user._id);
  };

  const getChatName = (chat) => {
    if (!chat) return '';
    if (chat.isAI) return 'Kimi AI';
    if (chat.isGroup) return chat.name;
    return getOtherUser(chat)?.name || chat.name || 'Chat';
  };

  const getChatStatus = (chat) => {
    if (!chat) return '';
    if (chat.isAI) return '🤖 AI Assistant · Always active';
    if (chat.isGroup) return `${chat.participants?.length || 0} members`;
    const other = getOtherUser(chat);
    return other?.isOnline ? 'Online' : 'Last seen recently';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── Left: Chat List ── */}
      <ChatList />

      {/* ── Right: Active Chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', overflow: 'hidden' }}>
        {!activeChat ? (
          /* ── Empty state ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16, color: 'var(--text-dim)',
          }}>
            {/* Logo — falls back to text if image missing */}
            {!logoErr ? (
              <img
                src="/images/logo.png"
                alt="KimiChat"
                onError={() => setLogoErr(true)}
                style={{
                  width: 72, height: 72,
                  borderRadius: 20,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 18px rgba(0,201,177,0.45))',
                }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34,
                boxShadow: '0 0 28px rgba(0,201,177,0.35)',
              }}>💬</div>
            )}

            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20,
              fontWeight: 700, color: 'var(--text)',
            }}>
              Select a conversation
            </div>
            <div style={{ fontSize: 14 }}>
              Choose from your chats or start a new one
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 20px', background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            }}>
              <Avatar
                name={getChatName(activeChat)}
                src={activeChat.avatar}
                size={42}
                online={activeChat.isAI ? true : getOtherUser(activeChat)?.isOnline}
                gradient={activeChat.isAI ? 'var(--teal),var(--blue)' : null}
                emoji={activeChat.isAI ? '🤖' : null}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                  {getChatName(activeChat)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: getOtherUser(activeChat)?.isOnline || activeChat.isAI
                    ? 'var(--green)' : 'var(--text-dim)',
                }}>
                  {getChatStatus(activeChat)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!activeChat.isGroup && !activeChat.isAI && (
                  <>
                    <HeaderBtn icon="📞" title="Audio Call" onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} />
                    <HeaderBtn icon="📹" title="Video Call" onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} />
                  </>
                )}
                <HeaderBtn icon="🔍" title="Search" />
                <HeaderBtn icon="⋯" title="More" />
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {activeChat.isAI ? '🤖' : '👋'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 16,
                    fontWeight: 600, color: 'var(--text)', marginBottom: 6,
                  }}>
                    {activeChat.isAI ? "Hi! I'm Kimi AI" : `Say hi to ${getChatName(activeChat)}`}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {activeChat.isAI
                      ? "Ask me anything — I'm here to help 24/7!"
                      : 'Send your first message below'}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || i}
                  message={msg}
                  isMe={msg.sender?._id === user._id || msg.sender === user._id}
                  showAvatar={i === 0 || chatMessages[i - 1]?.sender?._id !== msg.sender?._id}
                  isAI={msg.isAI || msg.type === 'ai' || activeChat.isAI}
                />
              ))}
              {typingUsers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--bg-card2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>
                    {activeChat.isAI ? '🤖' : typingUsers[0].name?.[0] || '?'}
                  </div>
                  <div style={{
                    background: 'var(--bg-card2)',
                    borderRadius: '4px 18px 18px 18px',
                    padding: '10px 16px',
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--text-dim)',
                        animation: `typingDot 1.2s ease-in-out infinite ${j * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px', background: 'var(--bg-card)',
              borderTop: '1px solid var(--border2)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {['😊', '📎', '📸', '🎤', '🎵'].map(icon => (
                  <button
                    key={icon}
                    style={{
                      padding: '5px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border2)',
                      color: 'var(--text-dim)', fontSize: 14,
                      cursor: 'pointer', transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.target.style.borderColor = 'var(--teal)'}
                    onMouseLeave={e => e.target.style.borderColor = 'var(--border2)'}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${getChatName(activeChat)}…`}
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid var(--border2)',
                    borderRadius: 14, padding: '12px 16px',
                    color: 'var(--text)', fontSize: 14,
                    fontFamily: 'var(--font-body)', outline: 'none',
                    resize: 'none', maxHeight: 120,
                    transition: 'border .2s', lineHeight: 1.5,
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    border: 'none', cursor: 'pointer',
                    background: input.trim()
                      ? 'linear-gradient(135deg,var(--teal),var(--blue))'
                      : 'rgba(255,255,255,0.06)',
                    color: input.trim() ? '#fff' : 'var(--text-dim)',
                    fontSize: 18, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s', flexShrink: 0,
                  }}
                >➤</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderBtn({ icon, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: 'none', color: 'var(--text)', fontSize: 17,
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--teal-glow)';
        e.currentTarget.style.color = 'var(--teal)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = 'var(--text)';
      }}
    >
      {icon}
    </button>
  );
}