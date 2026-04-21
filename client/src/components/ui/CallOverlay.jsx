import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';

/**
 * CallOverlay Component - Direct Render Mode
 * ✅ No Portals (Maximum Compatibility)
 * ✅ Emergency Visual Debugging (Borders)
 * ✅ Full Audio & State Sync
 */
export default function CallOverlay({ call, onEnd, onAccept, onReject }) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(call?.status || (call?.isIncoming ? 'incoming' : 'calling'));
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (call?.status) setStatus(call.status);
  }, [call?.status]);

  useEffect(() => {
    const playRingtone = () => {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        // Ringing for incoming (higher pitch), Ringback for outgoing
        const freq = call?.isIncoming ? 660 : 440;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      } catch (e) {}
    };

    if (status === 'incoming' || status === 'calling') {
      const interval = setInterval(playRingtone, status === 'incoming' ? 1500 : 2000);
      return () => clearInterval(interval);
    }
  }, [status, call?.isIncoming]);

  useEffect(() => {
    if (status === 'connected' && !timerRef.current) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  if (!call || !call.user) return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const OverlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000000,
    background: '#050a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '80px 20px 60px',
    color: '#fff',
    fontFamily: 'var(--font-body, sans-serif)',
    overflow: 'hidden'
  };

  const BackdropStyle = {
    position: 'absolute',
    inset: 0,
    background: `url(${call.user?.avatar}) center/cover no-repeat`,
    filter: 'blur(80px) brightness(0.3)',
    opacity: 0.6,
    zIndex: -1
  };

  return (
    <div style={OverlayStyle}>
      <div style={BackdropStyle} />
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Top Section: Info */}
      <div style={{ textAlign: 'center', animation: 'slide-up 0.6s ease' }}>
        <div style={{ fontSize: 14, color: '#00d4c8', fontWeight: 600, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
          {call.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px 0' }}>{call.user?.name}</h1>
        <div style={{ fontSize: 18, color: status === 'connected' ? '#00d4c8' : '#8fa8c8' }}>
          {status === 'connected' ? formatTime(duration) : (status === 'incoming' ? 'Incoming...' : 'Calling...')}
        </div>
      </div>

      {/* Center Section: Avatar with animated rings */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(status === 'incoming' || status === 'calling') && (
          <>
            <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '4px solid #00d4c8', animation: 'pulse-ring 2s infinite' }} />
            <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '4px solid #00d4c8', animation: 'pulse-ring 2s infinite 1s' }} />
          </>
        )}
        <div style={{ padding: 10, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
          <Avatar name={call.user?.name} src={call.user?.avatar} size={180} />
        </div>
      </div>

      {/* Bottom Section: Actions */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-around', alignItems: 'center', animation: 'slide-up 0.8s ease' }}>
        {status === 'incoming' ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={onReject}
                style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: '#ff4757', color: '#fff', fontSize: 32, cursor: 'pointer', boxShadow: '0 8px 30px rgba(255,71,87,0.4)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >📴</button>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, opacity: 0.8 }}>Decline</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={onAccept}
                style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: '#10b981', color: '#fff', fontSize: 32, cursor: 'pointer', boxShadow: '0 8px 30px rgba(16,185,129,0.4)', animation: 'bounce 2s infinite', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >📞</button>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, opacity: 0.8 }}>Accept</div>
            </div>
          </>
        ) : (
          <>
            <button 
              onClick={() => setMuted(!muted)}
              style={{ width: 60, height: 60, borderRadius: '50%', border: 'none', background: muted ? '#ff4757' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 24, cursor: 'pointer', transition: 'all 0.3s' }}
            >{muted ? '🔇' : '🎤'}</button>
            
            <button 
              onClick={onEnd}
              style={{ width: 90, height: 90, borderRadius: '50%', border: 'none', background: '#ff4757', color: '#fff', fontSize: 36, cursor: 'pointer', boxShadow: '0 10px 40px rgba(255,71,87,0.5)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >📴</button>

            <button 
              style={{ width: 60, height: 60, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 24, cursor: 'pointer' }}
            >🔊</button>
          </>
        )}
      </div>
    </div>
  );
}