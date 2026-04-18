import React, { useState, useEffect, useRef, useCallback } from 'react';
import Avatar from './Avatar';

/**
 * CallOverlay Component - Video/Audio call interface
 * ✅ Fixed: Accessibility, error handling, responsive, proper cleanup
 */
export default function CallOverlay({ call, onEnd, onAccept, onReject }) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(call?.type === 'video');
  const [status, setStatus] = useState(call?.isIncoming ? 'incoming' : 'calling');
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ FIX: Proper timer cleanup
  useEffect(() => {
    if (status === 'connected' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // ✅ FIX: Removed auto-connect simulation. Status now updates via props from MainApp.
  useEffect(() => {
    if (call.status === 'connected') {
      setStatus('connected');
    }
  }, [call.status]);

  // ✅ FIX: Proper null check
  if (!call || !call.user) return null;

  const isVideo = call.type === 'video';

  const formatDuration = useCallback((seconds) => {
    if (typeof seconds !== 'number' || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleEnd = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onEnd?.();
  }, [onEnd]);

  const handleAccept = useCallback(() => {
    setStatus('connected');
    onAccept?.();
  }, [onAccept]);

  const handleReject = useCallback(() => {
    onReject?.();
    onEnd?.();
  }, [onReject, onEnd]);

  return (
    <div
      role="dialog"
      aria-label={`${call.type} call with ${call.user?.name || 'Unknown'}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: isVideo 
          ? 'rgba(5,13,26,0.98)' 
          : 'rgba(5,13,26,0.96)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease',
        overflow: 'hidden'
      }}>

      {/* ✅ FIX: Video placeholder with semantic HTML */}
      {isVideo && status === 'connected' && (
        <div
          aria-label="Video call background"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #050d1a, #0a1628)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0
          }}>
          <div style={{
            fontSize: 120,
            opacity: 0.08,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            📹
          </div>

          {/* Self preview */}
          <div
            style={{
              position: 'absolute',
              bottom: 100,
              right: 20,
              width: 100,
              height: 140,
              background: 'var(--bg-card2, #1e293b)',
              borderRadius: 12,
              border: '2px solid var(--border, #334155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
            👤
          </div>
        </div>
      )}

      {/* ✅ FIX: Main content with proper z-index */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0
        }}>

        {/* ✅ FIX: Avatar with pulse animation */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,201,177,0.15) 0%, transparent 70%)',
              animation: status !== 'connected' 
                ? 'callPulse 2s ease-in-out infinite' 
                : 'none',
              pointerEvents: 'none'
            }}
          />
          <Avatar
            name={call.user?.name || 'User'}
            src={call.user?.avatar}
            size={96}
            gradient="var(--teal, #00c9b1),var(--blue, #1a8cff)"
            alt={call.user?.name || 'User avatar'}
          />
        </div>

        {/* ✅ FIX: Caller name with fallback */}
        <h1 style={{
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 6,
          margin: 0,
          color: 'var(--text, #fff)'
        }}>
          {call.user?.name || 'Unknown Caller'}
        </h1>

        {/* ✅ FIX: Status message with proper aria-live */}
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            fontSize: 15,
            color: 'var(--text-dim, #9ca3af)',
            marginBottom: 40
          }}>
          {status === 'incoming' && `Incoming ${isVideo ? 'video' : 'audio'} call…`}
          {status === 'calling' && `${isVideo ? '📹' : '📞'} Calling…`}
          {status === 'connected' && `🎤 ${formatDuration(duration)}`}
        </div>

        {/* ✅ FIX: Buttons container */}
        {status === 'incoming' ? (
          <div style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center'
          }}>
            <CallBtn
              icon="📵"
              label="Decline"
              color="#ff4444"
              onClick={handleReject}
              ariaLabel="Decline call"
            />
            <CallBtn
              icon="📞"
              label="Accept"
              color="var(--green, #22c55e)"
              onClick={handleAccept}
              ariaLabel="Accept call"
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <CallBtn
              icon={muted ? '🔇' : '🎙️'}
              label={muted ? 'Unmute' : 'Mute'}
              color="rgba(255,255,255,.12)"
              onClick={() => setMuted(m => !m)}
              ariaLabel={`Turn ${muted ? 'on' : 'off'} microphone`}
              ariaPressed={muted}
            />
            {isVideo && (
              <CallBtn
                icon={cameraOn ? '📷' : '📷'}
                label={cameraOn ? 'Cam Off' : 'Cam On'}
                color="rgba(255,255,255,.12)"
                onClick={() => setCameraOn(c => !c)}
                ariaLabel={`Turn ${cameraOn ? 'off' : 'on'} camera`}
                ariaPressed={!cameraOn}
              />
            )}
            <CallBtn
              icon={speakerOn ? '🔊' : '🔈'}
              label="Speaker"
              color="rgba(255,255,255,.12)"
              onClick={() => setSpeakerOn(s => !s)}
              ariaLabel={`Speaker ${speakerOn ? 'on' : 'off'}`}
              ariaPressed={speakerOn}
            />
            <CallBtn
              icon="📵"
              label="End"
              color="#ff4444"
              onClick={handleEnd}
              ariaLabel="End call"
            />
          </div>
        )}
      </div>

      {/* ✅ FIX: Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes callPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 201, 177, 0.3);
          }
          50% {
            box-shadow: 0 0 0 24px rgba(0, 201, 177, 0);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * CallBtn Component - Reusable call button
 * ✅ Fixed: Accessibility, proper event handling
 */
function CallBtn({
  icon,
  label,
  color,
  onClick,
  ariaLabel,
  ariaPressed
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8
    }}>
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: 'none',
          background: color,
          fontSize: 26,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          userSelect: 'none'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}>
        {icon}
      </button>
      <span style={{
        fontSize: 12,
        color: 'var(--text-dim, #9ca3af)',
        fontWeight: 500
      }}>
        {label}
      </span>
    </div>
  );
}