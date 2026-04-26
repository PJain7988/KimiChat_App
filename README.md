# 💬 KimiChat — AI-Powered Chat Universe

A full-stack **MERN** real-time chat application with AI assistant, global rooms, communities, status updates, audio/video calling, and friend discovery.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 **Kimi AI Chat** | Built-in AI assistant that replies to every message |
| 💬 **Real-time Messaging** | Socket.IO powered — typing indicators, read receipts, reactions |
| 🌐 **Global Chat Rooms** | General, Tech Talk, Gaming, Music, Art & Design |
| 🔵 **Status Updates** | 24-hour stories with text, custom backgrounds |
| 👥 **Friends System** | Friend requests, accept/reject, mutual friends |
| 🎲 **Random Discovery** | Auto-match with new users by interest |
| 🏘️ **Communities** | Create/join communities with categories & privacy settings |
| 📞 **Audio/Video Calls** | WebRTC-powered calling with Socket.IO signaling |
| 🔍 **Smart Search** | Search users, communities, messages globally |
| 🔐 **Auth** | Email/password, Mobile OTP, Google/Discord/GitHub OAuth |
| 👤 **Profile** | Edit profile, avatar color picker, KimiChat ID |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) or MongoDB Atlas URI

### 1. Clone & Install
```bash
git clone https://github.com/yourname/kimichat.git
cd kimichat
npm run install-all
```

### 2. Configure Environment
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kimichat
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```

### 3. Run Development Servers
```bash
npm run dev
```
This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:5173

---

## 📁 Project Structure

```
kimichat/
├── server/                    # Express + Socket.IO backend
│   ├── index.js               # Entry point
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Chat.js            # Chat/Group schema
│   │   ├── Message.js         # Message schema
│   │   ├── Community.js       # Community schema
│   │   ├── Status.js          # Status (expires 24h)
│   │   └── GlobalMessage.js   # Global room messages
│   ├── routes/
│   │   ├── auth.js            # Register, login, OTP, social
│   │   ├── users.js           # Profile, search, random
│   │   ├── chats.js           # DM & group chats
│   │   ├── messages.js        # Send, react, delete
│   │   ├── friends.js         # Add, accept, reject
│   │   ├── community.js       # Create, join, browse
│   │   ├── status.js          # Post, view, delete
│   │   └── global.js          # Global room messages
│   ├── socket/
│   │   └── socketHandler.js   # All real-time events
│   └── middleware/
│       └── auth.js            # JWT protect middleware
│
└── client/                    # React + Vite frontend
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css          # Global CSS variables & styles
        ├── pages/
        │   ├── Landing.jsx    # Landing — web vs APK
        │   ├── Auth.jsx       # Login/Register/OTP
        │   └── MainApp.jsx    # Main layout with routing
        ├── components/
        │   ├── layout/
        │   │   └── Sidebar.jsx
        │   ├── chat/
        │   │   ├── ChatPanel.jsx
        │   │   ├── ChatList.jsx
        │   │   └── MessageBubble.jsx
        │   ├── global/
        │   │   └── GlobalChat.jsx
        │   ├── status/
        │   │   └── StatusPanel.jsx
        │   ├── friends/
        │   │   └── FriendsPanel.jsx
        │   ├── community/
        │   │   └── CommunityPanel.jsx
        │   ├── search/
        │   │   └── SearchPanel.jsx
        │   ├── profile/
        │   │   └── ProfilePanel.jsx
        │   └── ui/
        │       ├── Avatar.jsx
        │       └── CallOverlay.jsx
        ├── context/
        │   ├── authStore.js   # Zustand auth store
        │   └── chatStore.js   # Zustand chat store
        └── utils/
            ├── api.js         # Axios instance
            └── socket.js      # Socket.IO client
```

---

## 🔌 Socket Events Reference

| Event | Direction | Description |
|---|---|---|
| `message:send` | Client→Server | Send a private message |
| `message:new` | Server→Client | New message received |
| `message:typing` | Both | Typing indicator |
| `message:read` | Client→Server | Mark messages read |
| `message:react` | Client→Server | React to message |
| `global:join` | Client→Server | Join a global room |
| `global:message` | Both | Global room message |
| `call:initiate` | Client→Server | Start a call |
| `call:incoming` | Server→Client | Incoming call |
| `call:answer` | Client→Server | Answer a call |
| `call:end` | Client→Server | End call |
| `friend:request` | Both | Friend request notification |
| `friend:accepted` | Both | Friend accepted notification |
| `user:online` | Server→Client | User came online |
| `user:offline` | Server→Client | User went offline |

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs

**Frontend:** React 18, Vite, React Router v6, Zustand, Axios, react-hot-toast

---

## 📱 Logo
Place your logo at: `client/public/images/logo.png`

It will be used as the app icon and PWA icon.

---

## 🔧 Production Build

```bash
# Build frontend
cd client && npm run build

# Serve with Express (add static serving to server/index.js)
npm start
```

---

## 📄 License
MIT © KimiChat 2024
