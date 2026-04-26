import { create } from 'zustand';
import api from '../utils/api';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  activeRoom: null,
  messages: {},        
  typing: {},          
  unread: {},          
  invitations: [],     
  loading: false,
  setActiveRoom: (room) => set({ activeRoom: room }),

  addInvitation: (invite) => set(state => {
    if (state.invitations.some(i => i.roomId === invite.roomId)) return {};
    return { invitations: [invite, ...state.invitations] };
  }),

  removeInvitation: (roomId) => set(state => ({
    invitations: state.invitations.filter(i => i.roomId !== roomId)
  })),

  fetchChats: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/chats');
      set({ chats: res.data.chats, loading: false });
    } catch { set({ loading: false }); }
  },

  setActiveChat: (chat) => set({ activeChat: chat }),

  openChat: (chat) => {
    set(state => {
      const exists = state.chats.some(c => c._id === chat._id);
      return {
        chats: exists ? state.chats : [chat, ...state.chats],
        activeChat: chat,
      };
    });
  },

  fetchMessages: async (chatId) => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      set(state => ({
        messages: { ...state.messages, [chatId]: res.data.messages },
        unread: { ...state.unread, [chatId]: 0 },
      }));
    } catch {}
  },

  sendMessage: async ({ chatId, senderId, content, type = 'text', fileUrl, sticker }) => {
     
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      chat: chatId,
      sender: { _id: senderId },
      content,
      type,
      fileUrl,
      sticker,
      createdAt: new Date().toISOString(),
      readBy: [senderId],
      isOptimistic: true,
    };
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), tempMsg],
      },
    }));

    try {
      const res = await api.post('/messages', { chatId, content, type, fileUrl, sticker });
       
      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] || []).map(m =>
            m._id === tempMsg._id ? res.data.message : m
          ),
        },
      }));
      return res.data.message;
    } catch {
       
      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] || []).filter(m => m._id !== tempMsg._id),
        },
      }));
    }
  },

  addIncomingMessage: (message) => {
    const chatId = message.chat?._id || message.chat;
    set(state => {
      const existing = state.messages[chatId] || [];
      const isDuplicate = existing.some(m => m._id === message._id);
      if (isDuplicate) return {};
      const activeId = state.activeChat?._id;
      return {
        messages: { ...state.messages, [chatId]: [...existing, message] },
        unread: chatId !== activeId
          ? { ...state.unread, [chatId]: (state.unread[chatId] || 0) + 1 }
          : state.unread,
      };
    });
  },

  setTyping: (chatId, user, isTyping) => {
    set(state => {
      const current = state.typing[chatId] || [];
      const filtered = current.filter(u => u.userId !== user.userId);
      return {
        typing: {
          ...state.typing,
          [chatId]: isTyping ? [...filtered, user] : filtered,
        },
      };
    });
  },

  openDirectChat: async (userId) => {
    const res = await api.post('/chats/direct', { userId });
    const chat = res.data.chat;
    set(state => {
      const exists = state.chats.some(c => c._id === chat._id);
      return {
        chats: exists ? state.chats : [chat, ...state.chats],
        activeChat: chat,
      };
    });
    return chat;
  },

  updateChatLastMsg: (chatId, message) => {
    set(state => ({
      chats: state.chats.map(c =>
        c._id === chatId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

   
  callLogs: JSON.parse(localStorage.getItem('kc_call_logs') || '[]'),
  addCallLog: (log) => {
    set(state => {
      const newLogs = [log, ...state.callLogs].slice(0, 50);
      localStorage.setItem('kc_call_logs', JSON.stringify(newLogs));
      return { callLogs: newLogs };
    });
  },
  clearCallLogs: () => {
    localStorage.removeItem('kc_call_logs');
    set({ callLogs: [] });
  },
}));

export default useChatStore;
