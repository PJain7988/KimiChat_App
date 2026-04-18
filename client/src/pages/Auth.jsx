import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import styles from './Auth.module.css';

/* ── OAuth provider config ─────────────────────────────── */
const SOCIAL = [
  {
    id: 'google', label: 'Google', bg: '#fff', color: '#444',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'discord', label: 'Discord', bg: '#5865F2', color: '#fff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.033.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
    ),
  },
  {
    id: 'github', label: 'GitHub', bg: '#24292e', color: '#fff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function Auth() {
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();
  const { login, register, verifyOtp, setUser, loading } = useAuthStore();

  const [mode,      setMode]      = useState('login');
  const [tab,       setTab]       = useState('email');
  const [form,      setForm]      = useState({ name:'', email:'', password:'', username:'', phone:'' });
  const [otp,       setOtp]       = useState(['','','','','','']);
  const [otpSent,   setOtpSent]   = useState(false);
  const [logoErr,   setLogoErr]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const otpRefs = useRef([]);

  /* ════════════════════════════════════════════════════
     OAUTH CALLBACK HANDLER
     Runs on mount — checks if Passport redirected back
     here with ?token=JWT or ?error=message in the URL
  ════════════════════════════════════════════════════ */
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    // OAuth error came back from server
    if (error) {
      toast.error(decodeURIComponent(error));
      // Clean URL so error doesn't persist on refresh
      navigate('/auth', { replace: true });
      return;
    }

    // Token received — complete the OAuth login
    if (token) {
      setOauthLoading(true);

      const finish = async () => {
        try {
          // 1. Save token
          localStorage.setItem('kimi_token', token);

          // 2. Fetch full user profile using the token
          const res  = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch profile');

          // 3. Save to localStorage + Zustand store
          localStorage.setItem('kimi_user', JSON.stringify(data.user));
          setUser(data.user);

          toast.success(`Welcome${data.user?.name ? ', ' + data.user.name.split(' ')[0] : ''}! 🎉`);
          navigate('/app', { replace: true });
        } catch (err) {
          console.error('[OAuth callback]', err.message);
          toast.error(err.message || 'Sign-in failed. Try again.');
          localStorage.removeItem('kimi_token');
          localStorage.removeItem('kimi_user');
          navigate('/auth', { replace: true });
        } finally {
          setOauthLoading(false);
        }
      };

      finish();
    }
  }, []); // only on mount

  /* ════════════════════════════════════════════════════
     While processing OAuth token — show spinner overlay
  ════════════════════════════════════════════════════ */
  if (oauthLoading) {
    return (
      <div style={{
        height:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:20,
        background:'#050d1a', color:'#e8f0fe',
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <style>{`@keyframes kcSpin{to{transform:rotate(360deg)}}`}</style>
        <img
          src="/images/logo.png" alt="KimiChat"
          onError={e => { e.target.style.display='none'; }}
          style={{ width:56, height:56, borderRadius:14, objectFit:'contain' }}
        />
        <div style={{
          width:44, height:44, borderRadius:'50%',
          border:'3px solid rgba(0,201,177,0.15)',
          borderTopColor:'#00c9b1',
          animation:'kcSpin .75s linear infinite',
        }} />
        <p style={{ fontSize:15, color:'#7a9cc0' }}>Completing sign-in…</p>
      </div>
    );
  }

  /* ── Helpers ──────────────────────────────────────── */
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

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
      toast.success('OTP sent!');
      if (res.data.dev_otp) toast(`Dev OTP: ${res.data.dev_otp}`, { icon: '🔑' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  /* ── Social login — passport redirect ────────────── */
  const handleSocialLogin = (provider) => {
    window.location.href = `${SERVER_URL}/api/auth/${provider}/redirect`;
  };

  /* ── Form submit ──────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tab === 'mobile') {
      if (!otpSent) return sendOtp();
      const otpStr = otp.join('');
      if (otpStr.length < 6) return toast.error('Enter full 6-digit OTP');
      const r = await verifyOtp(form.phone, otpStr);
      if (r.success) { toast.success('Welcome to KimiChat! 🎉'); navigate('/app'); }
      else toast.error(r.message);
      return;
    }

    if (mode === 'register') {
      if (!form.name || !form.email || !form.password || !form.username)
        return toast.error('All fields are required');
      const r = await register({ name:form.name, email:form.email, password:form.password, username:form.username });
      if (r.success) { toast.success('Account created! 🎉'); navigate('/app'); }
      else toast.error(r.message);
    } else {
      if (!form.email || !form.password) return toast.error('Enter email & password');
      const r = await login(form.email, form.password);
      if (r.success) { toast.success('Welcome back! 👋'); navigate('/app'); }
      else toast.error(r.message);
    }
  };

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className={styles.wrap}>
      <div className={`${styles.box} animate-scale-in`}>

        {/* Logo */}
        <div className={styles.logoRow}>
          {!logoErr ? (
            <img
              src="/images/logo.png" alt="KimiChat"
              className={styles.logoImg}
              onError={() => setLogoErr(true)}
            />
          ) : (
            <div className={styles.logoFallback}>💬</div>
          )}
          <span className={styles.logoName}>KimiChat</span>
        </div>

        <h2 className={styles.title}>
          {mode === 'register' ? 'Create Account 🚀' : 'Welcome Back 👋'}
        </h2>
        <p className={styles.sub}>
          {mode === 'register'
            ? 'Join millions chatting on KimiChat'
            : 'Sign in to continue your conversations'}
        </p>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['email', 'mobile'].map(t => (
            <button key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => { setTab(t); setOtpSent(false); setOtp(['','','','','','']); }}
            >
              {t === 'email' ? '📧 Email' : '📱 Mobile OTP'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'email' ? (
            <>
              {mode === 'register' && (
                <>
                  <Field label="Full Name" type="text"     value={form.name}     onChange={set('name')}     placeholder="John Doe" />
                  <Field label="Username"  type="text"     value={form.username} onChange={set('username')} placeholder="johndoe" />
                </>
              )}
              <Field label="Email"    type="email"    value={form.email}    onChange={set('email')}    placeholder="you@example.com" />
              <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </>
          ) : (
            <>
              <div className={styles.phoneRow}>
                <input className={styles.input} type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={set('phone')} style={{ flex:1 }} />
                <button type="button" className={styles.sendOtpBtn} onClick={sendOtp}>
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {otpSent && (
                <div className={styles.otpRow}>
                  {otp.map((d, i) => (
                    <input key={i} ref={el => (otpRefs.current[i] = el)}
                      className={styles.otpDigit} maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} />
              : tab === 'mobile' && !otpSent ? 'Send OTP →'
              : mode === 'register' ? 'Create Account →'
              : 'Sign In →'}
          </button>
        </form>

        {/* Social OAuth */}
        <div className={styles.divider}><span>or continue with</span></div>
        <div className={styles.socialRow}>
          {SOCIAL.map(s => (
            <button key={s.id}
              title={`Continue with ${s.label}`}
              onClick={() => handleSocialLogin(s.id)}
              style={{
                flex:'1', display:'flex', alignItems:'center', justifyContent:'center',
                gap:8, padding:'11px 8px', borderRadius:12, cursor:'pointer',
                background:s.bg, border:'1.5px solid rgba(255,255,255,0.1)',
                color:s.color, fontSize:13, fontWeight:600,
                fontFamily:'var(--font-body)', transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='none'; }}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Toggle */}
        <p className={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className={styles.toggleBtn}
            onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Reusable field ────────────────────────────────────── */
function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-dim)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>
        {label}
      </label>
      <input
        style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1.5px solid var(--border2)', borderRadius:12, padding:'12px 16px', color:'var(--text)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', transition:'border .2s' }}
        onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--border2)')}
        {...props}
      />
    </div>
  );
}