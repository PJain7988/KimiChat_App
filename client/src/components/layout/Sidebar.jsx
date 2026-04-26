import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import Avatar from '../ui/Avatar';

const NAV_ITEMS = [
  { path: '/app/chats', icon: '💬', label: 'Chats' },
  { path: '/app/calls', icon: '📞', label: 'Calls' },
  { path: '/app/global', icon: '🌍', label: 'Global' },
  { path: '/app/status', icon: '✨', label: 'Status' },
  { path: '/app/friends', icon: '👥', label: 'People' },
  { path: '/app/search', icon: '🔍', label: 'Search' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { activeChat, activeRoom } = useChatStore();
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isChatting = activeChat || activeRoom || (pathParts[1] === 'chats' && pathParts.length > 2) || (pathParts[1] === 'global' && pathParts.length > 2);

  // Hide sidebar on mobile if we are in a chat/room
  if (isChatting && window.innerWidth < 768) return null;

  return (
    <aside className={`
      bg-[#0a1628] border-[rgba(255,255,255,0.07)] z-50 transition-all
      md:w-[72px] md:h-full md:border-r md:flex md:flex-col md:items-center md:py-4
      fixed bottom-0 left-0 right-0 h-[64px] border-t flex flex-row items-center justify-around px-2
      md:static md:translate-y-0
    `}>
      {/* Branding Logo - Desktop */}
      <div className="hidden md:flex mb-6 cursor-pointer hover:opacity-80 transition-opacity">
        <NavLink to="/app/chats">
          <img src="/images/logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain" style={{ filter: 'drop-shadow(0 0 8px var(--teal))' }} />
        </NavLink>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-row md:flex-col items-center gap-1 md:gap-4 w-full md:w-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col md:flex-row items-center justify-center
              w-12 h-12 md:w-12 md:h-12 rounded-xl transition-all relative group
              ${isActive ? 'bg-[var(--teal-glow)] text-[var(--teal)]' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}
            `}
          >
            <span className="text-xl md:text-2xl">{item.icon}</span>
            <span className="text-[10px] md:hidden mt-1 font-medium">{item.label}</span>
            
            {/* Tooltip on Desktop */}
            <span className="hidden md:group-hover:block absolute left-16 bg-[#0d1f35] text-[var(--text)] text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 border border-[rgba(255,255,255,0.1)]">
              {item.label}
            </span>
          </NavLink>
        ))}

        {/* User Avatar - Mobile Only */}
        <div className="md:hidden flex items-center justify-center w-12 h-12">
          <NavLink to="/app/profile">
            <Avatar name={user?.name} src={user?.avatar} size={32} online={true} gradient="var(--teal),var(--blue)" />
          </NavLink>
        </div>
      </nav>

      {/* Profile/Settings Icon - Bottom on Desktop */}
      <div className="hidden md:flex mt-auto pt-6 border-t border-[rgba(255,255,255,0.07)] w-full justify-center">
        <NavLink 
          to="/app/profile"
          className={({ isActive }) => `
            w-12 h-12 rounded-xl flex items-center justify-center transition-all
            ${isActive ? 'bg-[var(--teal-glow)] text-[var(--teal)]' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}
          `}
        >
          ⚙️
        </NavLink>
      </div>
    </aside>
  );
}