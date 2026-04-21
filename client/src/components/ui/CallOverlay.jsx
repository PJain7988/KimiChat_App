import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { getSocket } from '../../utils/socket';

/**
 * Premium CallOverlay Component
 * Features: Video/Audio WebRTC, Floating local preview, Professional Glassmorphism
 */
export default function CallOverlay({ call, onEnd, onAccept, onReject }) {
  const [status, setStatus] = useState(call?.status || (call?.isIncoming ? 'incoming' : 'calling'));
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const isVideo = call?.type === 'video';
  const socket = getSocket();

  useEffect(() => {
    if (call?.status) setStatus(call.status);
  }, [call?.status]);

  // Duration timer
  useEffect(() => {
    if (status === 'connected' && !timerRef.current) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Ringtone / Calling Sound
  useEffect(() => {
    if (status === 'connected' || status === 'ended') return;
    
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(status === 'incoming' ? 440 : 660, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } catch (e) {}

    return () => { if(ctx) ctx.close(); };
  }, [status]);

  // WebRTC Setup
  useEffect(() => {
    if (status === 'connected') {
      initWebRTC();
    }
    return () => cleanupWebRTC();
  }, [status]);

  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('call:signal', { 
            targetUserId: call.user._id, 
            signal: { candidate: e.candidate } 
          });
        }
      };

      // Recipient creates Answer if they receive Offer
      // Caller creates Offer
      if (!call.isIncoming) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:signal', { targetUserId: call.user._id, signal: { offer } });
      }

      socket.on('call:signal', async ({ signal, fromUserId }) => {
        // Ensure we are signaling with the right person
        const targetId = fromUserId || call.user._id;
        
        if (signal.offer) {
          console.log('📡 [RTC] Received Offer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', { targetUserId: targetId, signal: { answer } });
        } else if (signal.answer) {
          console.log('📡 [RTC] Received Answer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.candidate) {
          console.log('📡 [RTC] Received ICE Candidate');
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(e => {});
        }
      });
    } catch (err) {
      console.error('Failed to start WebRTC:', err);
    }
  };

  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (pcRef.current) pcRef.current.close();
    socket.off('call:signal');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOff(!videoTrack.enabled);
      }
    }
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!call || !call.user) return null;

  return (
    <div style={overlayStyle}>
      {/* Background Blur / Video */}
      <div style={backgroundStyle}>
        {status === 'connected' && isVideo ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={glassOverlayStyle} />
        )}
      </div>

      {/* Main Content Container */}
      <div style={containerStyle}>
        
        {/* User Profile Info */}
        <div style={{ textAlign: 'center', marginBottom: 40, zIndex: 10 }}>
          <div style={avatarContainerStyle}>
            <Avatar name={call.user.name} src={call.user.avatar} size={150} />
            {status !== 'connected' && <div className="pulse-ring" />}
          </div>
          <h1 style={nameStyle}>{call.user.name}</h1>
          <p style={statusTextStyle}>
            {status === 'incoming' 
              ? `Incoming ${call.type} Call` 
              : status === 'calling' 
                ? 'Contacting...' 
                : formatTime(duration)}
          </p>
        </div>

        {/* Local Video Preview (PICTURE IN PICTURE) */}
        {status === 'connected' && isVideo && (
          <div style={localPreviewStyle}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} 
            />
            {camOff && <div style={camOffOverlay}>Camera Off</div>}
          </div>
        )}

        {/* Action Controls */}
        <div style={controlsStyle}>
          {status === 'incoming' ? (
            <div style={{ display: 'flex', gap: 40 }}>
              <button 
                onClick={onReject} 
                style={{ ...circleBtn, background: '#ff4757', boxShadow: '0 0 20px rgba(255,71,87,0.4)' }}
              >
                <span style={{ transform: 'rotate(135deg)', fontSize: 32 }}>📞</span>
              </button>
              <button 
                onClick={onAccept} 
                style={{ ...circleBtn, background: '#00d4c8', boxShadow: '0 0 20px rgba(0,212,200,0.4)', animation: 'pulse-green 1.5s infinite' }}
              >
                <span style={{ fontSize: 32 }}>📞</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <button onClick={toggleMute} style={{ ...smallBtn, background: muted ? '#ff4757' : 'rgba(255,255,255,0.1)' }}>
                {muted ? '🔇' : '🎤'}
              </button>
              
              <button onClick={onEnd} style={{ ...circleBtn, background: '#ff4757', width: 85, height: 85 }}>
                <span style={{ transform: 'rotate(135deg)', fontSize: 38 }}>📞</span>
              </button>

              <button onClick={toggleCamera} style={{ ...smallBtn, background: camOff ? '#ff4757' : 'rgba(255,255,255,0.1)' }}>
                {camOff ? '❌📹' : '📹'}
              </button>
              
              <button onClick={() => alert('Group calling feature coming soon!')} style={{ ...smallBtn, background: 'rgba(255,255,255,0.1)' }}>
                <span>👤+</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,212,200,0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(0,212,200,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,212,200,0); }
        }
        .pulse-ring {
          position: absolute; inset: -15px; border: 2px solid var(--teal); borderRadius: 50%;
          animation: ringPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0;
        }
        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* Styles */
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 99999999,
  background: '#000', color: '#fff',
  fontFamily: 'var(--font-display)', display: 'flex', flexDirection: 'column'
};
const backgroundStyle = {
  position: 'absolute', inset: 0, zIndex: 1
};
const glassOverlayStyle = {
  width: '100%', height: '100%',
  background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 100%)'
};
const containerStyle = {
  position: 'relative', zIndex: 10, flex: 1,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
};
const avatarContainerStyle = {
  position: 'relative', width: 150, height: 150, margin: '0 auto 20px',
  borderRadius: '50%', boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
};
const nameStyle = { fontSize: 48, fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-1px' };
const statusTextStyle = { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: 500 };
const localPreviewStyle = {
  position: 'fixed', top: 30, right: 30, width: 140, height: 210,
  borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)',
  boxShadow: '0 15px 30px rgba(0,0,0,0.4)', background: '#000', overflow: 'hidden'
};
const camOffOverlay = {
  position: 'absolute', inset: 0, background: '#111',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
};
const controlsStyle = {
  position: 'absolute', bottom: 60, left: 0, right: 0,
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
};
const circleBtn = {
  width: 75, height: 75, borderRadius: '50%', border: 'none',
  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', transition: 'all 0.2s'
};
const smallBtn = {
  width: 50, height: 50, borderRadius: '50%', border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 20, transition: 'all 0.2s'
};