import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import styles from './Sidebar.module.css';

const NAV = [
  {
    path: 'chats',
    label: 'Messages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    path: 'global',
    label: 'Global',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/>
      </svg>
    ),
  },
  {
    path: 'status',
    label: 'Status',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
      </svg>
    ),
  },
  {
    path: 'friends',
    label: 'Friends',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: 'community',
    label: 'Community',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    path: 'search',
    label: 'Search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { user }       = useAuthStore();
  const { unread }     = useChatStore();
  const [logoErr, setLogoErr] = useState(false);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  const isActive = (p) => location.pathname.includes(`/app/${p}`);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'K';

  return (
    <aside className={styles.sidebar}>

      {/* ── Logo ── */}
      <div className={styles.logoWrap} onClick={() => navigate('/app/chats')}>
        {!logoErr ? (
          <img
            src="/images/logo.png"
            alt="KimiChat"
            onError={() => setLogoErr(true)}
            className={styles.logoImg}
          />
        ) : (
          <div className={styles.logoFallback}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className={styles.divider} />

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        {NAV.map(({ path, icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              className={`${styles.navBtn} ${active ? styles.navActive : ''}`}
              onClick={() => navigate(`/app/${path}`)}
              title={label}
            >
              {/* Active indicator bar */}
              {active && <span className={styles.activeBar} />}

              {/* Icon */}
              <span className={styles.navIcon}>{icon}</span>

              {/* Label below icon */}
              <span className={styles.navLabel}>{label}</span>

              {/* Unread badge */}
              {path === 'chats' && totalUnread > 0 && (
                <span className={styles.badge}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      {/* ── Settings ── */}
      <div className={styles.bottomNav}>
        <button
          className={`${styles.navBtn} ${isActive('profile') ? styles.navActive : ''}`}
          onClick={() => navigate('/app/profile')}
          title="Settings"
        >
          {isActive('profile') && <span className={styles.activeBar} />}
          <span className={styles.navIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span className={styles.navLabel}>Settings</span>
        </button>

        {/* ── Avatar ── */}
        <button
          className={styles.avatarBtn}
          onClick={() => navigate('/app/profile')}
          title={user?.name || 'My Profile'}
        >
          <div className={styles.avatarRing}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
            <span className={styles.onlineDot} />
          </div>
          <span className={styles.navLabel} style={{ marginTop: 5 }}>
            {user?.name?.split(' ')[0] || 'You'}
          </span>
        </button>
      </div>

    </aside>
  );
}