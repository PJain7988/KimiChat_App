import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      {/* Orbs */}
      <div className={styles.orbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      <div className={`${styles.content} animate-fade-up`}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <img 
            src="/images/logo.png"
            alt="KimiChat Logo" 
            className={styles.logoImg}
          />
          <span className={styles.logoName}>KimiChat</span>
        </div>

        <h1 className={styles.headline}>
          Your AI-Powered<br />
          <span className="gradient-text">Chat Universe</span>
        </h1>
        <p className={styles.sub}>
          Chat with friends, explore global rooms, share status, join communities —
          all powered by <strong>Kimi AI</strong>.
        </p>

        {/* Feature pills */}
        {/* <div className={styles.pills}>
          {['🤖 AI Chat','🌐 Global Rooms','👥 Friends','🏘️ Communities','📞 Video Calls','📸 Status'].map(f => (
            <span key={f} className={styles.pill}>{f}</span>
          ))}
        </div> */}

        <div className={styles.btnGroup}>
          <button className={styles.btnPrimary} onClick={() => navigate('/auth')}>
            🌐 Open as Website
          </button>
          <div className={styles.orLabel}>or</div>
          <button className={styles.btnSecondary} onClick={() => navigate('/auth')}>
            📱 Download APK
          </button>
        </div>

        <p className={styles.terms}>
          By continuing you agree to our{' '}
          <span className={styles.link}>Terms of Service</span> &amp;{' '}
          <span className={styles.link}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
