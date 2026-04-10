import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { getSocket } from '../../utils/socket';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export default function MessageBubble({ message, isMe, showAvatar, isAI }) {
  const [showReact, setShowReact] = useState(false);
  const [localReactions, setLocalReactions] = useState(message.reactions || []);
  const [hoveredEmoji, setHoveredEmoji] = useState(null);

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isDeleted = message.deleted;
  const senderName = message.sender?.name || 'Unknown';

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
      <div style={{
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
        <div style={{
          padding: '11px 15px',
          borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          fontSize: 14,
          lineHeight: 1.55,
          wordBreak: 'break-word',
          background: isDeleted
            ? 'rgba(255,255,255,0.04)'
            : isMe
              ? 'linear-gradient(135deg,var(--teal),var(--teal-dim))'
              : isAI
                ? 'linear-gradient(135deg,rgba(0,201,177,0.12),rgba(26,140,255,0.12))'
                : 'var(--bg-card2)',
          color: isMe ? '#000' : 'var(--text)',
          border: isAI && !isMe ? '1px solid rgba(0,201,177,0.2)' : 'none',
          fontStyle: isDeleted ? 'italic' : 'normal',
          opacity: isDeleted ? 0.6 : message.isOptimistic ? 0.75 : 1,
          position: 'relative',
        }}>
          {isDeleted ? '🚫 This message was deleted' : message.content}

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