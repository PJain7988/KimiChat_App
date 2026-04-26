import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { getSocket } from '../../utils/socket';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export default function MessageBubble({ message, isMe, showAvatar, isAI, searchHighlight }) {
  const [showReact, setShowReact] = useState(false);
  const [localReactions, setLocalReactions] = useState(message.reactions || []);
  const [hoveredEmoji, setHoveredEmoji] = useState(null);

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isDeleted = message.deleted;
  const senderName = message.sender?.name || 'Unknown';

  const renderContent = () => {
    const rawContent = isDeleted ? '🚫 This message was deleted' : message.content;
    if (isDeleted || !rawContent) return rawContent;

    // Handle Stickers (from property or parsed from content)
    let stickerObj = message.sticker;
    if (!stickerObj && rawContent.startsWith('[sticker:')) {
      const parts = rawContent.match(/\[sticker:(.+):(.+)\]/);
      if (parts) stickerObj = { emoji: parts[1], label: parts[2] };
    }

    if ((message.type === 'sticker' || stickerObj) && stickerObj) {
      const { emoji, label, bg } = stickerObj;
      return (
        <div style={{
          background: bg || 'rgba(0,201,177,0.12)', borderRadius: 18,
          padding: '16px 12px 12px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6, width: 100, cursor: 'default',
          border: '1px solid rgba(0,201,177,0.2)'
        }}>
          <span style={{ fontSize: 48, lineHeight: 1 }}>{emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
      );
    }

    // Handle Audio messages
    if (message.type === 'audio' || rawContent.startsWith('🎤 Voice note') || rawContent.startsWith('🎵 Audio file')) {
      const isVoice = rawContent.startsWith('🎤');
      // For now, if there is no fileUrl, we render the text, but let's assume we might have it
      if (message.fileUrl) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <div style={{ fontSize: 13, color: isMe ? '#000' : 'var(--text-dim)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {isVoice ? '🎤 Voice Note' : '🎵 Audio File'}
            </div>
            <audio src={message.fileUrl} controls style={{ width: '100%', height: 36, borderRadius: 10 }} />
          </div>
        );
      }
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const isImage = (url) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url) || url.includes('tenor.com');

    // If it's a media URL, render it
    if (rawContent.match(urlRegex) && isImage(rawContent.trim())) {
      return (
        <img 
          src={rawContent.trim()} 
          alt="media" 
          style={{ maxWidth: '100%', borderRadius: 12, marginTop: 4, display: 'block', border: '1px solid var(--border2)' }} 
        />
      );
    }

    if (!searchHighlight) return rawContent;
    
    try {
      const parts = rawContent.split(new RegExp(`(${searchHighlight})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === searchHighlight.toLowerCase() ? (
          <span key={i} style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: isMe ? '#000' : 'var(--teal)', borderRadius: 2, padding: '0 2px', fontWeight: 'bold' }}>{part}</span>
        ) : (
          part
        )
      );
    } catch (e) {
      return rawContent;
    }
  };

  const handleReact = (emoji) => {
    // Optimistic UI update
    setLocalReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing) {
        // toggle off if same emoji clicked twice
        return prev.filter(r => r.emoji !== emoji);
      }
      return [...prev.filter(r => r.isMe !== true), { emoji, isMe: true, count: 1 }];
    });
    setShowReact(false);

    // Emit to socket
    const socket = getSocket();
    if (socket && message._id && !message._id.startsWith('temp_')) {
      socket.emit('message:react', { messageId: message._id, emoji });
    }
  };

  // Group reactions by emoji with count
  const groupedReactions = localReactions.reduce((acc, r) => {
    const key = r.emoji;
    if (!acc[key]) acc[key] = { emoji: key, count: 0, isMe: false };
    acc[key].count += 1;
    if (r.isMe) acc[key].isMe = true;
    return acc;
  }, {});

  return (
    <div
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-end',
        flexDirection: isMe ? 'row-reverse' : 'row',
        marginBottom: 2, position: 'relative',
      }}
      onMouseEnter={() => setShowReact(true)}
      onMouseLeave={() => { setShowReact(false); setHoveredEmoji(null); }}
    >
      {/* ── Avatar ── */}
      {!isMe && (
        <div style={{ width: 30, flexShrink: 0 }}>
          {showAvatar && (
            <Avatar
              name={isAI ? 'Kimi AI' : senderName}
              size={30}
              gradient={isAI ? 'var(--teal),var(--blue)' : 'var(--purple),var(--blue)'}
              emoji={isAI ? '🤖' : null}
              fontSize={12}
            />
          )}
        </div>
      )}

      {/* ── Bubble + meta ── */}
      <div className="message-bubble-container" style={{
        maxWidth: '65%', display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}>

        {/* AI label */}
        {isAI && showAvatar && !isMe && (
          <div style={{
            fontSize: 10, fontWeight: 700, marginBottom: 3,
            background: 'linear-gradient(90deg,var(--teal),var(--blue))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ✦ Kimi AI
          </div>
        )}

        {/* ── Reaction picker bar ── */}
        {showReact && !isDeleted && (
          <div style={{
            display: 'flex', gap: 2, marginBottom: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border2)',
            borderRadius: 24, padding: '5px 10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            alignItems: 'center',
          }}>
            {EMOJI_REACTIONS.map(e => (
              <button
                key={e}
                onClick={() => handleReact(e)}
                onMouseEnter={() => setHoveredEmoji(e)}
                onMouseLeave={() => setHoveredEmoji(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: hoveredEmoji === e ? 22 : 16,
                  cursor: 'pointer',
                  transition: 'font-size .15s cubic-bezier(.34,1.56,.64,1), transform .15s',
                  transform: hoveredEmoji === e ? 'translateY(-3px)' : 'translateY(0)',
                  padding: '2px 4px',
                  borderRadius: 8,
                  lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 28,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* ── Message bubble ── */}
        <div className="message-bubble" style={{
          padding: '11px 15px',
          borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          fontSize: 14,
          lineHeight: 1.55,
          wordBreak: 'break-word',
          boxShadow: isAI ? '0 0 16px rgba(0,201,177,0.15)' : 'none',
          background: isDeleted
            ? 'rgba(255,255,255,0.04)'
            : isMe
              ? 'linear-gradient(135deg,var(--teal),var(--teal-dim))'
              : isAI
                ? 'linear-gradient(135deg,rgba(0,201,177,0.12),rgba(26,140,255,0.12))'
                : 'var(--bg-card2)',
          color: isMe ? '#000' : 'var(--text)',
          border: isAI && !isMe ? '1px solid rgba(0,201,177,0.3)' : 'none',
          fontStyle: isDeleted ? 'italic' : 'normal',
          opacity: isDeleted ? 0.6 : message.isOptimistic ? 0.75 : 1,
          position: 'relative',
        }}>
          {renderContent()}

          {/* Reactions display on bubble */}
          {Object.values(groupedReactions).length > 0 && (
            <div style={{
              display: 'flex', gap: 4, marginTop: 8,
              flexWrap: 'wrap',
            }}>
              {Object.values(groupedReactions).map(({ emoji, count, isMe: mine }) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 12,
                    background: mine
                      ? 'rgba(0,201,177,0.2)'
                      : 'rgba(255,255,255,0.1)',
                    border: mine
                      ? '1px solid rgba(0,201,177,0.45)'
                      : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    padding: '2px 8px',
                    cursor: 'pointer',
                    color: isMe ? '#000' : 'var(--text)',
                    transition: 'all .2s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = mine
                      ? 'rgba(0,201,177,0.3)'
                      : 'rgba(255,255,255,0.18)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = mine
                      ? 'rgba(0,201,177,0.2)'
                      : 'rgba(255,255,255,0.1)';
                  }}
                >
                  <span style={{ fontSize: 13 }}>{emoji}</span>
                  {count > 1 && (
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Time + read receipt ── */}
        <div style={{
          fontSize: 10, color: 'var(--text-dim)', marginTop: 3,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {time}
          {isMe && (
            <span style={{ color: message.readBy?.length > 1 ? 'var(--blue)' : 'var(--text-dim)' }}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}