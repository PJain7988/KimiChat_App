import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import styles from './Auth.module.css';

const SOCIAL = [
  { id: 'google', label: 'Google', icon: '🇬' },
  { id: 'discord', label: 'Discord', icon: '🎮' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, verifyOtp, loading } = useAuthStore();

  const [mode, setMode] = useState('login');   // login | register | otp
  const [tab, setTab] = useState('email');   // email | mobile
  const [form, setForm] = useState({ name: '', email: '', password: '', username: '', phone: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const otpRefs = useRef([]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // OTP digit input
  const handleOtpChange = (i, val) => {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const sendOtp = async () => {
    if (!form.phone) return toast.error('Enter phone number');
    try {
      const res = await api.post('/auth/send-otp', { phone: form.phone });
      setOtpSent(true);
      toast.success('OTP sent! (Check console in dev)');
      if (res.data.dev_otp) toast(`Dev OTP: ${res.data.dev_otp}`, { icon: '🔑' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tab === 'mobile') {
      if (!otpSent) return sendOtp();
      const otpStr = otp.join('');
      if (otpStr.length < 6) return toast.error('Enter full OTP');
      const r = await verifyOtp(form.phone, otpStr);
      if (r.success) { toast.success('Welcome to KimiChat! 🎉'); navigate('/app'); }
      else toast.error(r.message);
      return;
    }

    if (mode === 'register') {
      if (!form.name || !form.email || !form.password || !form.username)
        return toast.error('All fields are required');
      const r = await register({ name: form.name, email: form.email, password: form.password, username: form.username });
      if (r.success) { toast.success('Account created! 🎉'); navigate('/app'); }
      else toast.error(r.message);
    } else {
      if (!form.email || !form.password) return toast.error('Enter email & password');
      const r = await login(form.email, form.password);
      if (r.success) { toast.success('Welcome back! 👋'); navigate('/app'); }
      else toast.error(r.message);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.box} animate-scale-in`}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <img
            src="/images/logo.png"
            alt="KimiChat Logo"
            className={styles.logoImg}
          />
          <span className={styles.logoName}>KimiChat</span>
        </div>

        <h2 className={styles.title}>
          {mode === 'register' ? 'Create Account 🚀' : 'Welcome Back 👋'}
        </h2>
        <p className={styles.sub}>
          {mode === 'register' ? 'Join millions chatting on KimiChat' : 'Sign in to continue your conversations'}
        </p>

        {/* Email / Mobile tabs */}
        <div className={styles.tabs}>
          {['email', 'mobile'].map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
              {t === 'email' ? '📧 Email' : '📱 Mobile OTP'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'email' ? (
            <>
              {mode === 'register' && (
                <>
                  <Field label="Full Name" type="text" value={form.name} onChange={set('name')} placeholder="John Doe" />
                  <Field label="Username" type="text" value={form.username} onChange={set('username')} placeholder="@johndoe" />
                </>
              )}
              <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </>
          ) : (
            <>
              <div className={styles.phoneRow}>
                <input className={styles.input} type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={set('phone')} style={{ flex: 1 }} />
                <button type="button" className={styles.sendOtpBtn} onClick={sendOtp}>
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {otpSent && (
                <div className={styles.otpRow}>
                  {otp.map((d, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      className={styles.otpDigit}
                      maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : (
              tab === 'mobile' && !otpSent ? 'Send OTP →' :
                mode === 'register' ? 'Create Account →' : 'Sign In →'
            )}
          </button>
        </form>

        {/* Social */}
        <div className={styles.divider}><span>or continue with</span></div>
        <div className={styles.socialRow}>
          {SOCIAL.map(s => (
            <button key={s.id} className={styles.socialBtn} title={s.label}
              onClick={() => toast(`${s.label} OAuth – integrate in production`, { icon: '🔗' })}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Toggle mode */}
        <p className={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className={styles.toggleBtn} onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}
      </label>
      <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = 'var(--teal)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
        {...props}
      />
    </div>
  );
}
