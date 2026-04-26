import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import api from '../utils/api';

const SOCIAL = [
  { id: 'google', label: 'Google', bg: 'bg-white', text: 'text-gray-800' },
  { id: 'discord', label: 'Discord', bg: 'bg-[#5865F2]', text: 'text-white' },
  { id: 'github', label: 'GitHub', bg: 'bg-[#24292e]', text: 'text-white' },
];

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, verifyOtp, loading } = useAuthStore();

  const [mode, setMode] = useState('login');
  const [tab, setTab] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', password: '', username: '', phone: '' });
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (error) toast.error(decodeURIComponent(error));
    if (token) {
      localStorage.setItem('kimi_token', token);
      window.location.href = '/app/chats';
    }
  }, [searchParams]);

  const handleOAuth = (provider) => {
    window.location.href = `${SERVER_URL}/api/auth/${provider}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(tab === 'email' ? form.email : form.phone, form.password);
        navigate('/app/chats');
      } else {
        await register(form);
        toast.success('Account created! Please login.');
        setMode('login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050d1a]">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--teal)] opacity-[0.05] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--blue)] opacity-[0.05] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-[#0a1628] border border-[rgba(255,255,255,0.07)] rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 animate-modal-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-[rgba(0,201,177,0.2)] mb-4">
            <span className="font-bold text-black">K</span>
          </div>
          <h1 className="text-2xl font-bold font-display">{mode === 'login' ? 'Welcome Back' : 'Join KimiChat'}</h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">{mode === 'login' ? 'Enter your details to continue' : 'Start your journey with us today'}</p>
        </div>

        {/* Tab Toggle (Email / Phone) */}
        <div className="flex p-1 bg-[#0d1f35] rounded-xl mb-6">
          <button 
            onClick={() => setTab('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'email' ? 'bg-[#1e3050] text-[var(--teal)] shadow-sm' : 'text-[var(--text-dim)]'}`}
          >Email Address</button>
          <button 
            onClick={() => setTab('phone')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'phone' ? 'bg-[#1e3050] text-[var(--teal)] shadow-sm' : 'text-[var(--text-dim)]'}`}
          >Phone Number</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-4">
              <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
              <Input label="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="johndoe123" />
            </div>
          )}
          
          {tab === 'email' ? (
            <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="name@company.com" />
          ) : (
            <Input label="Phone Number" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" />
          )}

          <Input label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all mt-2"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[rgba(255,255,255,0.05)]"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a1628] px-2 text-[var(--text-dim)]">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SOCIAL.map(s => (
            <button 
              key={s.id} 
              onClick={() => handleOAuth(s.id)}
              className={`py-3 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95 ${s.bg} ${s.text}`}
            >
              {s.label[0]}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--text-dim)] mt-8">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[var(--teal)] font-bold hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest px-1">{label}</label>
      <input 
        className="w-full bg-[#0d1f35] border border-[rgba(255,255,255,0.05)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--teal)] transition-all"
        {...props}
      />
    </div>
  );
}