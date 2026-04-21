import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import useChatStore from '../context/chatStore';
import { getSocket, initSocket } from '../utils/socket';

import Sidebar       from '../components/layout/Sidebar';
import ChatPanel     from '../components/chat/ChatPanel';
import GlobalChat    from '../components/global/GlobalChat';
import StatusPanel   from '../components/status/StatusPanel';
import FriendsPanel  from '../components/friends/FriendsPanel';
import CommunityPanel from '../components/community/CommunityPanel';
import SearchPanel   from '../components/search/SearchPanel';
import ProfilePanel  from '../components/profile/ProfilePanel';
import CallsPanel    from '../components/chat/CallsPanel';
import CallOverlay   from '../components/ui/CallOverlay';
import { Toaster, toast } from 'react-hot-toast';
import styles from './MainApp.module.css';

export default function MainApp() {
  const { user } = useAuthStore();
  const { addIncomingMessage, setTyping, updateChatLastMsg, addInvitation, unread } = useChatStore();
  const [activeCall, setActiveCall] = useState(null);
  const activeCallRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/chats', { replace: true });
    }
  }, []);

  // 🔄 Socket Instance Management
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user?._id) {
       const s = getSocket() || initSocket(user._id);
       setSocket(s);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!socket) return;
    const s = socket;

    const register = () => {
      if (user?._id) {
          console.log('📡 [SOCKET] Sending user:online for:', user._id);
          s.emit('user:online', user._id);
      }
    };

    if (s.connected) register();
    s.on('connect', register);

    // Handshake confirmation
    s.on('socket:registered', ({ userId }) => {
      console.log('✅ [SOCKET] Registered for calls & messages:', userId);
    });

    // 🕵️ Diagnostic: Listen for the server's reachability debug signal
    s.on('call:debug', (info) => {
      if (info.targetId === user?._id) {
        console.warn(`🕵️ [DIAGNOSTIC] Server is TRYING to call you (sent by ${info.from}), but you didn't receive the direct signal! Check rooms.`);
        toast.error(`Missed signal from ${info.from}. Connection might be unstable.`, { id: 'diag' });
      }
    });

    s.onAny((event, ...args) => {
      console.log(`🔌 [SOCKET] Event: ${event}`, args);
    });

    // Request Browser Notification Permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    s.on('message:new', ({ chatId, message }) => {
      console.log('📬 Message via Socket:', { chatId, message });
      const id = chatId || message.chat?._id || message.chat;
      
      const isMe = message.sender?._id === user._id || message.sender === user._id;

      addIncomingMessage(message);
      updateChatLastMsg(id, message);

      // 🔔 WhatsApp Style Notification
      if (!isMe) {
        const senderName = message.sender?.name || 'New Message';
        const content = message.type === 'text' ? message.content : `Sent a ${message.type}`;
        
        // 1. Toast Notification
        toast((t) => (
          <div onClick={() => { navigate(`/app/chats`); toast.dismiss(t.id); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💬</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{senderName}</div>
              <div style={{ fontSize: 12, opacity: 0.8, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{content}</div>
            </div>
          </div>
        ), { position: 'top-right', duration: 4000 });

        // 2. Browser Notification (if permission granted and window not focused)
        if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
          new Notification(senderName, {
            body: content,
            icon: '/images/logo.png' // Ensure this exists or use a fallback
          });
        }

        // 3. Audio Ping
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      }
    });

    s.on('message:typing', ({ chatId, userId, userName, isTyping }) => {
      setTyping(chatId, { userId, name: userName }, isTyping);
    });

    s.on('call:incoming', (data) => {
      console.log('🔔 [SIGNAL] Incoming call signal received from:', data.from?.name);
      
      // Auto-reject if already in a call
      if (activeCallRef.current) {
        console.warn('⚠️ Busy: Auto-rejecting incoming call');
        s.emit('call:reject', { targetUserId: data.from?._id });
        return;
      }

      const incomingCall = { 
        ...data, 
        isIncoming: true, 
        user: data.from, 
        status: 'incoming' 
      };

      // Save initial log as "missed" (will be updated if accepted or ended)
      saveCallLog(incomingCall, 'missed');
      
      setActiveCall(incomingCall);
      
      // WhatsApp Style Toast (Optional, as CallOverlay also shows it)
      toast.custom((t) => (
        <div style={{
          background: '#1e293b', color: '#fff', padding: '12px 16px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #334155',
          display: 'flex', alignItems: 'center', gap: 12, animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📞</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{data.from?.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Incoming {data.type} call...</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { endCall(); toast.dismiss(t.id); }} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Decline</button>
            <button onClick={() => { acceptCall(); toast.dismiss(t.id); }} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Accept</button>
          </div>
        </div>
      ), { duration: 15000 });
    });

    s.on('call:accepted', (data) => {
      console.log('✅ Call Accepted by other party');
      setActiveCall(prev => {
        if (!prev) return null;
        const updated = { ...prev, status: 'connected' };
        saveCallLog(updated, 'connected');
        return updated;
      });
    });

    s.on('call:rejected', () => {
      console.log('❌ Call Rejected by other party');
      if (activeCallRef.current) {
        saveCallLog(activeCallRef.current, 'rejected');
      }
      setActiveCall(null);
      toast.error('Call rejected');
    });
    
    s.on('call:ended', ({ fromUserId }) => {
      console.log('📴 Call Ended by other party');
      if (activeCallRef.current) {
        // If it was an incoming call that never progressed past 'incoming', it's MISSED
        const finalStatus = (activeCallRef.current.isIncoming && activeCallRef.current.status === 'incoming') 
          ? 'missed' 
          : 'ended';
        saveCallLog(activeCallRef.current, finalStatus);
      }
      setActiveCall(null);
      toast.dismiss();
    });
    
    s.on('global:invite', (inv) => {
      addInvitation(inv);
      import('react-hot-toast').then(({ toast }) => {
        toast((t) => (
          <span onClick={() => { navigate('/app/global'); toast.dismiss(t.id); }} style={{ cursor: 'pointer' }}>
            📬 <b>{inv.senderName}</b> invited you to <b>{inv.roomName}</b>. Click to view!
          </span>
        ), { duration: 6000, position: 'top-right' });
      });
    });

    return () => {
      s.off('connect', register);
      s.off('socket:registered');
      s.off('call:debug');
      s.off('message:new');
      s.off('message:typing');
      s.off('call:incoming');
      s.off('call:accepted');
      s.off('call:rejected');
      s.off('call:ended');
      s.off('global:invite');
    };
  }, [socket, user?._id, addIncomingMessage, setTyping, updateChatLastMsg, addInvitation, navigate]);

  // 🔔 Reactive Tab Title with Unread Count
  useEffect(() => {
    const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) KimiChat` : 'KimiChat';
  }, [unread]);

  const saveCallLog = (call, status) => {
    try {
      if (!call?.user) return;
      let logs = JSON.parse(localStorage.getItem('kc_call_logs') || '[]');
      
      // Use a consistent ID for the call sequence if available, or fall back to timestamp
      const logId = call.callId || call.timestamp || new Date().toISOString();
      
      // Filter out previous versions of this specific call log to update it
      logs = logs.filter(l => l.id !== logId);

      let finalStatus = status;
      if (status === 'ended' || status === 'connected') finalStatus = 'completed';
      if (status === 'rejected') finalStatus = 'declined';
      // 'missed' stays 'missed'

      const newLog = {
        id: logId,
        user: call.user,
        type: call.type,
        direction: call.isIncoming ? 'incoming' : 'outgoing',
        status: finalStatus,
        timestamp: call.timestamp || new Date().toISOString()
      };
      
      localStorage.setItem('kc_call_logs', JSON.stringify([newLog, ...logs].slice(0, 50)));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to save call log:', err);
    }
  };

  const startCall = (targetUser, type) => {
    if (!targetUser) return;
    const tid = String(targetUser._id);
    console.log('📞 Initiating call to:', tid);
    
    const callData = { 
      user: targetUser, 
      type, 
      isIncoming: false, 
      status: 'calling',
      timestamp: new Date().toISOString()
    };
    
    saveCallLog(callData, 'outgoing');
    setActiveCall(callData);
    
    const socket = getSocket();
    if (socket) {
      socket.emit('call:initiate', { targetUserId: tid, type });
    }
  };

  const acceptCall = () => {
    const currentCall = activeCallRef.current;
    if (!currentCall) {
      console.warn('⚠️ Cannot accept call: no active call in ref');
      return;
    }
    console.log('✅ Accepting call from:', currentCall.user._id);
    const updated = { ...currentCall, status: 'connected' };
    setActiveCall(updated);
    saveCallLog(updated, 'connected');
    const socket = getSocket();
    if (socket) socket.emit('call:accept', { targetUserId: String(currentCall.user._id) });
  };

  const rejectCall = () => {
    const currentCall = activeCallRef.current;
    if (currentCall?.user?._id) {
      console.log('❌ Rejecting call from:', currentCall.user._id);
      const socket = getSocket();
      if (socket) socket.emit('call:reject', { targetUserId: String(currentCall.user._id) });
      saveCallLog(currentCall, 'rejected');
    }
    setActiveCall(null);
  };

  const endCall = () => {
    const currentCall = activeCallRef.current;
    if (currentCall?.user?._id) {
      console.log('📵 Ending call with:', currentCall.user._id);
      const socket = getSocket();
      if (socket) socket.emit('call:end', { targetUserId: String(currentCall.user._id) });
      saveCallLog(currentCall, 'ended');
    }
    setActiveCall(null);
  };

  return (
    <div className={styles.wrap}>
      <Toaster position="top-right" />
      <Sidebar />
      <div className={styles.content}>
        <Routes>
          <Route path="chats/*"   element={<ChatPanel onStartCall={startCall} />} />
          <Route path="calls"     element={<CallsPanel onStartCall={startCall} />} />
          <Route path="global"    element={<GlobalChat />} />
          <Route path="status"    element={<StatusPanel />} />
          <Route path="friends"   element={<FriendsPanel onStartCall={startCall} />} />
          <Route path="community" element={<CommunityPanel />} />
          <Route path="search"    element={<SearchPanel />} />
          <Route path="profile"   element={<ProfilePanel />} />
        </Routes>
      </div>

      {activeCall && (
        <CallOverlay
          call={activeCall}
          onEnd={endCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </div>
  );
}
