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
import CallOverlay   from '../components/ui/CallOverlay';
import styles from './MainApp.module.css';

export default function MainApp() {
  const { user } = useAuthStore();
  const { addIncomingMessage, setTyping, updateChatLastMsg, addInvitation } = useChatStore();
  const [activeCall, setActiveCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/chats', { replace: true });
    }
  }, []);

  useEffect(() => {
    const s = getSocket() || initSocket(user._id);
    if (!s) return;

    if (user?._id) {
       s.emit('user:online', user._id);
    }

    s.on('message:new', ({ chatId, message }) => {
      console.log('📬 Message via Socket:', { chatId, message });
      const id = chatId || message.chat?._id || message.chat;
      addIncomingMessage(message);
      updateChatLastMsg(id, message);

      // Check if chat is muted before showing notification/playing sound
      const muted = JSON.parse(localStorage.getItem('kc_muted_chats') || '[]');
      const globalMuted = JSON.parse(localStorage.getItem('muted_rooms') || '[]');

      if (!muted.includes(id) && !globalMuted.includes(message.room)) {
        // Here you would normally play a sound or show a desktop notification
      }
    });

    s.on('message:typing', ({ chatId, userId, userName, isTyping }) => {
      setTyping(chatId, { userId, name: userName }, isTyping);
    });

    s.on('call:incoming', (data) => {
      setActiveCall({ ...data, isIncoming: true, user: data.from, status: 'incoming' });
    });

    s.on('call:accepted', () => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    });

    s.on('call:ended', () => setActiveCall(null));
    s.on('call:rejected', () => setActiveCall(null));
    
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
      s.off('message:new');
      s.off('message:typing');
      s.off('call:incoming');
      s.off('call:accepted');
      s.off('call:ended');
      s.off('call:rejected');
      s.off('global:invite');
    };
  }, [user._id, addIncomingMessage, setTyping, updateChatLastMsg]);

  const startCall = (targetUser, type) => {
    if (!targetUser) return;
    setActiveCall({ user: targetUser, type, isIncoming: false, status: 'calling' });
    const socket = getSocket();
    if (socket) socket.emit('call:initiate', { targetUserId: targetUser._id, type });
  };

  const acceptCall = () => {
    if (!activeCall) return;
    setActiveCall(prev => ({ ...prev, status: 'connected' }));
    const socket = getSocket();
    if (socket) socket.emit('call:accept', { targetUserId: activeCall.user._id });
  };

  const endCall = () => {
    if (activeCall?.user?._id) {
      const socket = getSocket();
      if (socket) socket.emit('call:end', { targetUserId: activeCall.user._id });
    }
    setActiveCall(null);
  };

  return (
    <div className={styles.wrap}>
      <Sidebar />
      <div className={styles.content}>
        <Routes>
          <Route path="chats/*"   element={<ChatPanel onStartCall={startCall} />} />
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
          onReject={endCall}
        />
      )}
    </div>
  );
}
