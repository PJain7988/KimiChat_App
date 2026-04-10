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
  const { addIncomingMessage, setTyping, updateChatLastMsg } = useChatStore();
  const [activeCall, setActiveCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/chats', { replace: true });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket() || initSocket(user._id);

    socket.on('message:new', ({ chatId, message }) => {
      addIncomingMessage(message);
      updateChatLastMsg(chatId || message.chat?._id || message.chat, message);
    });

    socket.on('message:typing', ({ chatId, userId, userName, isTyping }) => {
      setTyping(chatId, { userId, name: userName }, isTyping);
    });

    socket.on('call:incoming', (data) => {
      setActiveCall({ ...data, isIncoming: true, user: data.from });
    });

    socket.on('call:ended', () => setActiveCall(null));
    socket.on('call:rejected', () => setActiveCall(null));

    return () => {
      socket.off('message:new');
      socket.off('message:typing');
      socket.off('call:incoming');
      socket.off('call:ended');
      socket.off('call:rejected');
    };
  }, []);

  const startCall = (targetUser, type) => {
    if (!targetUser) return;
    setActiveCall({ user: targetUser, type, isIncoming: false });
    const socket = getSocket();
    if (socket) socket.emit('call:initiate', { targetUserId: targetUser._id, type });
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
          onAccept={() => {}}
          onReject={endCall}
        />
      )}
    </div>
  );
}
