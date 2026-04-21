import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { toast } from 'react-hot-toast';
import styles from './MainApp.module.css';
import { isSameId } from '../utils/idUtils';

export default function MainApp() {
  const { user } = useAuthStore();
  const { addIncomingMessage, setTyping, updateChatLastMsg, addInvitation, addCallLog } = useChatStore();
  const [activeCall, setActiveCall] = useState(null);
  const activeCallRef = useRef(null);
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

  // ── CALL SIGNALING RECOVERY & MANAGEMENT ──
  const handleIncomingCall = useCallback((data) => {
    console.log('📬 [SIGNAL] handleIncomingCall triggered with data:', data);
    
    // 1. Check if actually for us
    const targetId = data.targetUserId ? String(data.targetUserId) : null;
    const myId = user?._id ? String(user._id) : null;
    
    console.log(`🔍 [SIGNAL] Filtering: targetId=${targetId}, myId=${myId}`);

    if (targetId && targetId !== myId) {
      console.warn('🙅 [SIGNAL] Ignoring call meant for another recipient:', targetId);
      return;
    }
    
    if (!myId) {
      console.error('❌ [SIGNAL] Received call but user ID is missing from local state!');
    }

    // 2. Reject if busy
    if (activeCallRef.current) {
      console.warn('⚠️ [SIGNAL] Busy - Rejecting incoming call');
      const s = getSocket();
      if (s) s.emit('call:reject', { targetUserId: data.from?._id });
      return;
    }

    console.log('🔔 [SIGNAL] Legitimate incoming call from:', data.from?.name);
    
    // 3. Trigger Overlay
    setActiveCall({ ...data, isIncoming: true, user: data.from, status: 'incoming' });

    // 4. Trigger Professional Toast
    toast.custom((t) => (
      <div style={{
        background: '#050c18', color: '#fff', padding: '16px 20px', borderRadius: '18px',
        boxShadow: '0 15px 50px rgba(0,0,0,0.8)', border: '1px solid var(--teal)',
        display: 'flex', alignItems: 'center', gap: 15, 
        animation: t.visible ? 'incomingCallSlideIn 0.4s ease-out' : 'incomingCallSlideOut 0.4s ease-in',
        transform: t.visible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: t.visible ? 1 : 0
      }}>
        <div style={{ position:'relative' }}>
           <div style={{ 
             width:44, height:44, borderRadius:'50%', background:'var(--teal)', 
             display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
             boxShadow: '0 0 15px var(--teal)'
           }}>
             {data.type === 'video' ? '📹' : '📞'}
           </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{data.from?.name}</div>
          <div style={{ fontSize: 13, color: '#00d4c8', fontWeight:600 }}>Incoming {data.type} call...</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { toast.dismiss(t.id); }} style={{ background: 'var(--teal)', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}>OPEN</button>
          <button onClick={() => { 
            const s = getSocket();
            if(s) s.emit('call:reject', { targetUserId: data.from?._id });
            setActiveCall(null);
            toast.dismiss(t.id);
          }} style={{ background: '#ff4757', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}>MISS</button>
        </div>
      </div>
    ), { duration: 25000 });
  }, [user?._id]);

  useEffect(() => {
    const s = getSocket() || initSocket(user?._id);
    if (!s) return;

    const register = () => {
      if (user?._id) {
         console.log('📡 [REGISTER] Sending user:online for:', user._id);
         s.emit('user:online', user._id);
      }
    };

    if (s.connected) register();
    s.on('connect', register);

    // Call signaling handshake confirmed
    s.on('socket:registered', ({ userId }) => {
      console.log('✅ [SOCKET] Handshake Successful:', userId);
    });

    // ── CORE SIGNALING SUITE ──
    s.on('call:incoming', (data) => {
       console.log('📩 Signal: Direct/Room incoming call');
       handleIncomingCall(data);
    });

    s.on('call:incoming:broadcast', (data) => {
       console.log('📩 Signal: Broadcast recovery signal');
       handleIncomingCall(data);
    });

    s.on('call:accepted', (data) => {
      console.log('✅ Signal: Call accepted by peer');
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    });

    s.on('call:accepted:internal', (data) => {
      if (String(user?._id) === String(data.targetUserId) && activeCallRef.current?.status === 'calling') {
         console.log('✅ Signal: Syncing accepted status');
         setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      }
    });

    s.on('call:rejected', () => {
      console.log('❌ Signal: Call rejected');
      if (activeCallRef.current) saveCallLog(activeCallRef.current, 'rejected');
      setActiveCall(null);
    });

    s.on('call:ended', () => {
      console.log('📴 Signal: Call ended');
      if (activeCallRef.current) saveCallLog(activeCallRef.current, 'ended');
      setActiveCall(null);
    });

    // Chat/Message listeners...
    s.on('message:new', ({ chatId, message }) => {
      const id = chatId || message.chat?._id || message.chat;
      addIncomingMessage(message);
      updateChatLastMsg(id, message);
    });

    s.on('message:typing', ({ chatId, userId, userName, isTyping }) => {
      setTyping(chatId, { userId, name: userName }, isTyping);
    });
    
    s.on('global:invite', (inv) => addInvitation(inv));

    return () => {
      s.off('connect', register);
      s.off('socket:registered');
      s.off('call:incoming');
      s.off('call:incoming:broadcast');
      s.off('call:accepted');
      s.off('call:accepted:internal');
      s.off('call:rejected');
      s.off('call:ended');
      s.off('message:new');
      s.off('message:typing');
      s.off('global:invite');
    };
  }, [user?._id, handleIncomingCall, addIncomingMessage, setTyping, updateChatLastMsg, addInvitation]);

  const saveCallLog = (call, status) => {
    addCallLog({
      user: call.user,
      type: call.type,
      status: status,
      direction: call.isIncoming ? 'incoming' : 'outgoing',
      timestamp: new Date().toISOString()
    });
  };

  const startCall = (targetUser, type) => {
    if (!targetUser) return;
    const tid = String(targetUser._id);
    console.log('☎️ CALLING:', tid);
    
    const callData = { user: targetUser, type, isIncoming: false, status: 'calling' };
    setActiveCall(callData);
    const s = getSocket();
    if (s) s.emit('call:initiate', { targetUserId: tid, type });
  };

  const endCall = () => {
    if (!activeCall) return;
    const s = getSocket();
    if (s) s.emit('call:end', { targetUserId: String(activeCall.user._id) });
    saveCallLog(activeCall, 'ended');
    setActiveCall(null);
  };

  const acceptCall = () => {
    if (!activeCall) return;
    console.log('✅ Accepting call...');
    setActiveCall(prev => ({ ...prev, status: 'connected' }));
    const s = getSocket();
    if (s) s.emit('call:accept', { targetUserId: String(activeCall.user._id) });
  };

  const rejectCall = () => {
    if (!activeCall) return;
    const s = getSocket();
    if (s) s.emit('call:reject', { targetUserId: String(activeCall.user._id) });
    saveCallLog(activeCall, 'missed'); // Log as missed if rejected
    setActiveCall(null);
  };

  return (
    <div className={styles.wrap}>
      <Sidebar />
      <div className={styles.content}>
        <Routes>
          <Route path="chats"     element={<ChatPanel onStartCall={startCall} />} />
          <Route path="calls"     element={<CallsPanel onStartCall={startCall} />} />
          <Route path="global"    element={<GlobalChat />} />
          <Route path="status"    element={<StatusPanel />} />
          <Route path="friends"   element={<FriendsPanel onStartCall={startCall} />} />
          <Route path="community" element={<CommunityPanel />} />
          <Route path="search"    element={<SearchPanel onStartCall={startCall} />} />
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
