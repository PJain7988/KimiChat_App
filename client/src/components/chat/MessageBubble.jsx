import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { getSocket } from '../../utils/socket';
import { getMediaUrl } from '../../utils/mediaUtils';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export default function MessageBubble({ message, isMe, showAvatar, isAI, searchHighlight }) {
  const [showReact, setShowReact] = useState(false);
  const [localReactions, setLocalReactions] = useState(message.reactions || []);

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isDeleted = message.deleted;
  const senderName = message.sender?.name || 'Unknown';

  const renderContent = () => {
    const rawContent = isDeleted ? '🚫 This message was deleted' : message.content;
    if (isDeleted || !rawContent) return rawContent;

    // Links & Images
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    if (rawContent.match(urlRegex) && /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(rawContent.trim())) {
      return (
        <img 
          src={getMediaUrl(rawContent.trim())} 
          alt="media" 
          className="max-w-full rounded-lg mt-1 border border-[rgba(255,255,255,0.1)] block"
        />
      );
    }

    return rawContent;
  };

  const handleReact = (emoji) => {
    setLocalReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing) return prev.filter(r => r.emoji !== emoji);
      return [...prev, { emoji, isMe: true }];
    });
    setShowReact(false);
    const socket = getSocket();
    if (socket && message._id && !message._id.startsWith('temp_')) {
      socket.emit('message:react', { messageId: message._id, emoji });
    }
  };

  return (
    <div 
      className={`flex gap-3 mb-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowReact(true)}
      onMouseLeave={() => setShowReact(false)}
    >
      {/* Avatar (Left side, only for others) */}
      {!isMe && (
        <div className="w-8 shrink-0 flex items-end pb-1">
          {showAvatar && (
            <Avatar 
              name={isAI ? 'Kimi AI' : senderName} 
              size={32} 
              online={isAI}
              gradient={isAI ? 'var(--teal),var(--blue)' : null}
            />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Reaction Menu (Floating) */}
        {showReact && !isDeleted && (
          <div className="flex gap-1 mb-1 p-1.5 bg-[#1e3050] border border-[rgba(255,255,255,0.1)] rounded-full shadow-xl animate-fade-in">
            {EMOJI_REACTIONS.map(e => (
              <button 
                key={e} 
                onClick={() => handleReact(e)}
                className="hover:scale-125 transition-transform px-1.5 text-base"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* The Bubble */}
        <div className={`
          relative px-4 py-2.5 rounded-2xl text-sm transition-all
          ${isMe 
            ? 'bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-black rounded-tr-none shadow-md' 
            : 'bg-[#1e3050] text-[var(--text)] rounded-tl-none border border-[rgba(255,255,255,0.05)]'}
          ${isDeleted ? 'italic opacity-60' : ''}
        `}>
          {renderContent()}
          
          <div className={`text-[10px] mt-1 opacity-60 flex items-center justify-end gap-1`}>
            {time}
            {isMe && <span className="text-[12px]">✓</span>}
          </div>

          {/* Display Reactions */}
          {localReactions.length > 0 && (
            <div className="absolute -bottom-3 left-2 flex gap-1">
              {localReactions.slice(0, 3).map((r, idx) => (
                <div key={idx} className="bg-[#0d1f35] border border-[rgba(255,255,255,0.1)] rounded-full px-1.5 py-0.5 text-[10px] shadow-sm">
                  {r.emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}