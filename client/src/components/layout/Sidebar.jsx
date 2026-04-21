import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import styles from './Sidebar.module.css';

/**
 * Sidebar Navigation Component
 * ✅ Fixed: Accessibility, proper state management, error handling
 */

const NAV = [
  {
    path: 'chats',
    label: 'Messages',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: 'calls',
    label: 'Calls',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    path: 'global',
    label: 'Global',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
      </svg>
    ),
  },
  {
    path: 'status',
    label: 'Status',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
      </svg>
    ),
  },
  {
    path: 'friends',
    label: 'Friends',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: 'community',
    label: 'Community',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: 'search',
    label: 'Search',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { unread } = useChatStore();
  const [logoError, setLogoError] = useState(false);

  // ✅ FIX: Safe unread calculation
  const totalUnread = useMemo(() => {
    if (!unread || typeof unread !== 'object') return 0;
    return Object.values(unread).reduce((sum, count) => {
      const num = typeof count === 'number' ? count : 0;
      return sum + num;
    }, 0);
  }, [unread]);

  // ✅ FIX: Memoized isActive check
  const isActive = useCallback((path) => {
    if (!location?.pathname) return false;
    return location.pathname.includes(`/app/${path}`);
  }, [location?.pathname]);

  // ✅ FIX: Safe initials calculation
  const initials = useMemo(() => {
    if (!user?.name || typeof user.name !== 'string') return 'K';
    return user.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'K';
  }, [user?.name]);

  const handleLogoClick = useCallback(() => {
    navigate('/app/chats');
  }, [navigate]);

  const handleNavClick = useCallback((path) => {
    navigate(`/app/${path}`);
  }, [navigate]);

  const handleProfileClick = useCallback(() => {
    navigate('/app/profile');
  }, [navigate]);

  if (!user) {
    return (
      <aside className={styles.sidebar} role="complementary">
        <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-dim)'}}>
          Loading...
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={styles.sidebar}
      role="navigation"
      aria-label="Main navigation">

      {/* ── Logo ── */}
      <div
        className={styles.logoWrap}
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleLogoClick();
          }
        }}
        aria-label="Go to messages"
        style={{ cursor: 'pointer' }}>
        {!logoError && user?.avatar ? (
          <img
            src={user.avatar}
            alt="KimiChat Logo"
            className={styles.logoImg}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className={styles.logoFallback} aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className={styles.divider} aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className={styles.nav} aria-label="Main menu">
        {NAV.map(({ path, icon, label }) => {
          const active = isActive(path);
          const hasUnread = path === 'chats' && totalUnread > 0;

          return (
            <button
              key={path}
              className={`${styles.navBtn} ${active ? styles.navActive : ''}`}
              onClick={() => handleNavClick(path)}
              aria-current={active ? 'page' : undefined}
              aria-label={`${label}${hasUnread ? `, ${totalUnread} unread messages` : ''}`}
              title={label}>

              {/* Active indicator bar */}
              {active && <span className={styles.activeBar} aria-hidden="true" />}

              {/* Icon */}
              <span className={styles.navIcon} aria-hidden="true">
                {icon}
              </span>

              {/* Label */}
              <span className={styles.navLabel}>{label}</span>

              {/* Unread badge */}
              {hasUnread && (
                <span
                  className={styles.badge}
                  aria-label={`${totalUnread} unread`}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      {/* ── Settings ── */}
      <div className={styles.bottomNav} role="navigation" aria-label="Secondary menu">

        {/* Settings Button */}
        <button
          className={`${styles.navBtn} ${isActive('profile') ? styles.navActive : ''}`}
          onClick={() => handleNavClick('profile')}
          aria-current={isActive('profile') ? 'page' : undefined}
          aria-label="Settings"
          title="Settings">
          {isActive('profile') && <span className={styles.activeBar} aria-hidden="true" />}
          <span className={styles.navIcon} aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className={styles.navLabel}>Settings</span>
        </button>

        {/* ── Avatar ── */}
        <button
          className={styles.avatarBtn}
          onClick={handleProfileClick}
          aria-label={`Profile: ${user?.name || 'My Profile'}`}
          title={user?.name || 'My Profile'}>
          <div className={styles.avatarRing}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user?.name || 'User'} avatar`}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              initials
            )}
            <span className={styles.onlineDot} aria-label="Online status" />
          </div>
          <span className={styles.navLabel} style={{ marginTop: 5 }}>
            {user?.name ? user.name.split(/\s+/)[0] : 'You'}
          </span>
        </button>
      </div>

    </aside>
  );
}