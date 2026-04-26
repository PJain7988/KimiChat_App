import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import useChatStore from '../context/chatStore';
import { getSocket, initSocket } from '../utils/socket';

import Sidebar from '../components/layout/Sidebar';
import ChatPanel from '../components/chat/ChatPanel';
import GlobalChat from '../components/global/GlobalChat';
import StatusPanel from '../components/status/StatusPanel';
import FriendsPanel from '../components/friends/FriendsPanel';
import CommunityPanel from '../components/community/CommunityPanel';
import SearchPanel from '../components/search/SearchPanel';
import ProfilePanel from '../components/profile/ProfilePanel';
import CallsPanel from '../components/chat/CallsPanel';
import CallOverlay from '../components/ui/CallOverlay';
import { toast } from 'react-hot-toast';

export default function MainApp() {
  const { user } = useAuthStore();
  const { addIncomingMessage, updateChatLastMsg, addInvitation } = useChatStore();
  const [activeCall, setActiveCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/chats', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Socket Logic
  useEffect(() => {
    const s = getSocket() || initSocket(user?._id);
    if (!s) return;

    const register = () => {
      if (user?._id) s.emit('user:online', user._id);
    };

    if (s.connected) register();
    s.on('connect', register);
    
    s.on('message:new', ({ chatId, message }) => {
      addIncomingMessage(message);
      updateChatLastMsg(chatId || message.chat?._id, message);
    });

    s.on('call:incoming', (data) => setActiveCall({ ...data, isIncoming: true, status: 'incoming' }));
    s.on('call:ended', () => setActiveCall(null));

    s.on('global:invite', (data) => {
      addInvitation(data);
      toast.success(`New invite to ${data.roomName}!`);
    });

    return () => {
      s.off('connect', register);
      s.off('message:new');
      s.off('call:incoming');
      s.off('call:ended');
    };
  }, [user?._id, addIncomingMessage, updateChatLastMsg]);

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row h-full w-full overflow-hidden bg-[#050d1a]" style={{ height: '100dvh' }}>
      <Sidebar activeCall={activeCall} endCall={() => setActiveCall(null)} />
      
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Routes>
          <Route path="chats/*" element={<ChatPanel />} />
          <Route path="calls" element={<CallsPanel />} />
          <Route path="global/*" element={<GlobalChat />} />
          <Route path="status" element={<StatusPanel />} />
          <Route path="friends" element={<FriendsPanel />} />
          <Route path="community" element={<CommunityPanel />} />
          <Route path="search" element={<SearchPanel />} />
          <Route path="profile" element={<ProfilePanel />} />
        </Routes>
      </main>

      {activeCall && (
        <CallOverlay 
          call={activeCall} 
          onEnd={() => setActiveCall(null)} 
          onAccept={() => setActiveCall(prev => ({...prev, status: 'connected'}))}
          onReject={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
