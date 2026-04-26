import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';

export default function Sidebar({ activeCall, endCall }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { unread, activeChat, activeRoom } = useChatStore();
  const [logoError, setLogoError] = useState(false);

  const totalUnread = useMemo(() => {
    if (!unread || typeof unread !== 'object') return 0;
    return Object.values(unread).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
  }, [unread]);

  const isActive = (path) => location.pathname.includes(`/app/${path}`);

  const handleNav = (path) => navigate(`/app/${path}`);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isChatting = activeChat || activeRoom || 
                    (pathParts[1] === 'chats' && pathParts.length > 2) || 
                    (pathParts[1] === 'global' && pathParts.length > 2);

  // Hide sidebar on mobile when in a chat
  if (isChatting && window.innerWidth < 768) return null;

  return (
    <aside className={`
      w-full h-16 md:w-20 md:h-full bg-[#0a1628] border-t md:border-t-0 md:border-r border-[rgba(255,255,255,0.07)]
      flex md:flex-col items-center justify-between px-4 md:px-0 md:py-6 shrink-0 z-50
    `}>
      {/* Top Logo / App Icon (Desktop Only) */}
      <div 
        onClick={() => handleNav('chats')}
        className="hidden md:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] items-center justify-center cursor-pointer shadow-lg shadow-[rgba(0,201,177,0.2)] mb-8"
      >
        <span className="text-xl font-bold text-black">K</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-1 md:flex-col items-center justify-around md:justify-start md:gap-4 w-full">
        <NavItem 
          icon="💬" 
          active={isActive('chats')} 
          onClick={() => handleNav('chats')} 
          badge={totalUnread}
        />
        <NavItem 
          icon="🌍" 
          active={isActive('global')} 
          onClick={() => handleNav('global')} 
        />
        <NavItem 
          icon="📞" 
          active={isActive('calls')} 
          onClick={() => handleNav('calls')} 
        />
        <NavItem 
          icon="✨" 
          active={isActive('status')} 
          onClick={() => handleNav('status')} 
        />
        <NavItem 
          icon="👥" 
          active={isActive('friends')} 
          onClick={() => handleNav('friends')} 
        />
      </nav>

      {/* User Profile (Bottom/Right) */}
      <div 
        onClick={() => handleNav('profile')}
        className={`
          w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-2 transition-all
          ${isActive('profile') ? 'border-[var(--teal)]' : 'border-transparent hover:border-[rgba(0,201,177,0.3)]'}
        `}
      >
        {user?.avatar && !logoError ? (
          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
        ) : (
          <div className="w-full h-full bg-[#1e3050] flex items-center justify-center text-xs font-bold text-[var(--teal)]">
            {user?.name?.[0] || 'U'}
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ icon, active, onClick, badge }) {
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-3 rounded-xl cursor-pointer transition-all duration-200
        ${active ? 'bg-[rgba(0,201,177,0.1)] text-[var(--teal)]' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}
      `}
    >
      <span className="text-2xl">{icon}</span>
      {badge > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-[#ff4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a1628]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {active && (
        <div className="hidden md:block absolute left-[-4px] top-1/4 bottom-1/4 w-1 bg-[var(--teal)] rounded-full shadow-[0_0_8px_var(--teal)]" />
      )}
    </div>
  );
}