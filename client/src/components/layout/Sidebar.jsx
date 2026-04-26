import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const MENU_ITEMS = [
  { id: 'chats', label: 'Messages', icon: '💬', path: '/app/chats' },
  { id: 'global', label: 'Global', icon: '🌍', path: '/app/global' },
  { id: 'friends', label: 'Friends', icon: '👥', path: '/app/friends' },
  { id: 'calls', label: 'Calls', icon: '📞', path: '/app/calls' },
  { id: 'status', label: 'Status', icon: '✨', path: '/app/status' },
  { id: 'search', label: 'Explore', icon: '🔍', path: '/app/search' },
  { id: 'profile', label: 'Settings', icon: '⚙️', path: '/app/profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  // On mobile, hide the sidebar if we are inside a chat
  const isChatting = pathname.split('/').filter(Boolean).length >= 3;

  if (isChatting && window.innerWidth < 768) return null;

  return (
    <nav className="w-full md:w-20 lg:w-24 bg-[#0a1628] border-t md:border-t-0 md:border-r border-[rgba(255,255,255,0.07)] flex md:flex-col items-center justify-around md:justify-start md:py-8 md:gap-8 shrink-0 z-50">
      {/* Brand Logo (Desktop) */}
      <div 
        onClick={() => navigate('/app/chats')}
        className="hidden md:flex w-12 h-12 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-xl items-center justify-center text-2xl font-bold cursor-pointer shadow-lg shadow-[rgba(0,201,177,0.2)]"
      >
        <span className="text-black">K</span>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex md:flex-col items-center justify-around md:justify-center w-full md:gap-6 py-2 md:py-0">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group relative flex flex-col items-center justify-center p-2"
              title={item.label}
            >
              <div className={`
                w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300
                ${isActive ? 'bg-[var(--teal)] text-black shadow-lg scale-110' : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-white'}
              `}>
                {item.icon}
              </div>
              <span className={`text-[9px] mt-1 font-bold uppercase tracking-widest md:hidden lg:block ${isActive ? 'text-[var(--teal)]' : 'text-[var(--text-dim)]'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="hidden md:block absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--teal)] rounded-full shadow-[0_0_8px_var(--teal)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* User Avatar (Desktop) */}
      <div 
        onClick={() => navigate('/app/profile')}
        className="hidden md:block w-10 h-10 rounded-full border-2 border-[var(--teal)] p-0.5 cursor-pointer hover:scale-110 transition-all"
      >
        <img src={user?.avatar} alt="Me" className="w-full h-full rounded-full object-cover" />
      </div>
    </nav>
  );
}