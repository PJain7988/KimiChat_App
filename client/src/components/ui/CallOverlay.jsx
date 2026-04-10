import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';

export default function CallOverlay({ call, onEnd, onAccept, onReject }) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(call?.type === 'video');
  const [status, setStatus] = useState(call?.isIncoming ? 'incoming' : 'calling');
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Auto-connect simulation for outgoing
  useEffect(() => {
    if (status === 'calling') {
      const t = setTimeout(() => setStatus('connected'), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!call) return null;

  const isVideo = call.type === 'video';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: isVideo ? 'rgba(5,13,26,0.98)' : 'rgba(5,13,26,0.96)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn .3s ease',
    }}>
      {/* Video placeholder */}
      {isVideo && status === 'connected' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#050d1a,#0a1628)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 120, opacity: 0.08 }}>📹</div>
          {/* Self preview */}
          <div style={{ position: 'absolute', bottom: 100, right: 20, width: 100, height: 140, background: 'var(--bg-card2)', borderRadius: 12, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
            👤
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {/* Avatar with pulse */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            position: 'absolute', inset: -16,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(0,201,177,0.15) 0%,transparent 70%)',
            animation: status !== 'connected' ? 'callPulse 2s ease-in-out infinite' : 'none',
          }} />
          <Avatar name={call.user?.name || 'User'} src={call.user?.avatar} size={96} gradient="var(--teal),var(--blue)" />
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          {call.user?.name || 'Unknown'}
        </div>

        <div style={{ fontSize: 15, color: 'var(--text-dim)', marginBottom: 40 }}>
          {status === 'incoming' && `Incoming ${isVideo ? 'video' : 'audio'} call…`}
          {status === 'calling' && `${isVideo ? '📹' : '📞'} Calling…`}
          {status === 'connected' && `🎤 ${formatDuration(duration)}`}
        </div>

        {/* Buttons */}
        {status === 'incoming' ? (
          <div style={{ display: 'flex', gap: 32 }}>
            <CallBtn icon="📵" label="Decline" color="#ff4444" onClick={() => { onReject?.(); onEnd?.(); }} />
            <CallBtn icon="📞" label="Accept" color="var(--green)" onClick={() => { setStatus('connected'); onAccept?.(); }} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            <CallBtn icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} color="rgba(255,255,255,.12)" onClick={() => setMuted(m => !m)} />
            {isVideo && <CallBtn icon={cameraOn ? '📷' : '📷'} label={cameraOn ? 'Cam Off' : 'Cam On'} color="rgba(255,255,255,.12)" onClick={() => setCameraOn(c => !c)} />}
            <CallBtn icon={speakerOn ? '🔊' : '🔈'} label="Speaker" color="rgba(255,255,255,.12)" onClick={() => setSpeakerOn(s => !s)} />
            <CallBtn icon="📵" label="End" color="#ff4444" onClick={onEnd} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes callPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(0,201,177,0.3);}
          50%{box-shadow:0 0 0 24px rgba(0,201,177,0);}
        }
      `}</style>
    </div>
  );
}

function CallBtn({ icon, label, color, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button onClick={onClick} style={{
        width: 64, height: 64, borderRadius: '50%', border: 'none',
        background: color, fontSize: 26, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {icon}
      </button>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}
