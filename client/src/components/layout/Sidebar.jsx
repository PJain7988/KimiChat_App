import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';

const NAV = [
  { path: 'chats', label: 'Messages', icon: '💬' },
  { path: 'calls', label: 'Calls', icon: '📞' },
  { path: 'global', label: 'Global', icon: '🌍' },
  { path: 'status', label: 'Status', icon: '✨' },
  { path: 'friends', label: 'Friends', icon: '👥' },
  { path: 'community', label: 'Groups', icon: '🏠' },
  { path: 'search', label: 'Search', icon: '🔍' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { unread, activeChat, activeRoom } = useChatStore();

  const totalUnread = useMemo(() => {
    return unread ? Object.values(unread).reduce((a, b) => a + (b || 0), 0) : 0;
  }, [unread]);

  const isActive = (path) => location.pathname.includes(`/app/${path}`);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isChatting = activeChat || activeRoom || 
                    (pathParts[1] === 'chats' && pathParts.length > 2) || 
                    (pathParts[1] === 'global' && pathParts.length > 2);

  // Hide on mobile when chatting
  if (isChatting && window.innerWidth < 768) return null;

  return (
    <aside className={`
      shrink-0 bg-[#0a1628] border-[rgba(255,255,255,0.07)] z-50 transition-all duration-300
      w-full h-[65px] border-t fixed bottom-0 left-0 right-0
      md:w-[75px] md:h-full md:border-t-0 md:border-r md:relative md:flex md:flex-col
    `}>
      {/* Desktop Logo */}
      <div className="hidden md:flex h-[72px] items-center justify-center cursor-pointer" onClick={() => navigate('/app/chats')}>
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-xl shadow-lg shadow-[rgba(0,201,177,0.2)] flex items-center justify-center text-xl">💬</div>
      </div>

      {/* Navigation Icons */}
      <nav className={`
        flex-1 flex h-full items-center justify-around px-2
        md:flex-col md:justify-start md:pt-4 md:space-y-4
      `}>
        {NAV.map(({ path, label, icon }) => {
          const active = isActive(path);
          const hasUnread = path === 'chats' && totalUnread > 0;

          return (
            <button
              key={path}
              onClick={() => navigate(`/app/${path}`)}
              className={`
                relative p-3 rounded-2xl transition-all duration-200 group
                ${active ? 'bg-[rgba(0,201,177,0.1)] text-[var(--teal)]' : 'text-gray-400 hover:bg-[rgba(255,255,255,0.05)]'}
              `}
              title={label}
            >
              <span className="text-xl md:text-2xl">{icon}</span>
              {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--teal)] rounded-l-full hidden md:block" />}
              {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-[var(--teal)] rounded-t-full md:hidden" />}
              
              {hasUnread && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0a1628]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}

              {/* Tooltip on Desktop */}
              <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden md:block whitespace-nowrap z-[100]">
                {label}
              </span>
            </button>
          );
        })}

        <div className="md:flex-1" />

        {/* Profile / Settings */}
        <button
          onClick={() => navigate('/app/profile')}
          className={`
            p-1.5 rounded-2xl transition-all
            ${isActive('profile') ? 'ring-2 ring-[var(--teal)] ring-offset-2 ring-offset-[#0a1628]' : 'hover:scale-105'}
          `}
        >
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center text-sm md:text-base font-bold">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
        </button>
      </nav>
    </aside>
  );
}