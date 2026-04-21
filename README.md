# 💬 KimiChat — The Ultimate AI Chat Universe

<p align="center">
  <img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" alt="Maintained" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/MERN-Stack-orange.svg" alt="MERN" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-black.svg" alt="Socket.io" />
</p>

KimiChat is a feature-rich, full-stack **MERN** application designed to redefine real-time communication. It combines traditional messaging with modern social features like stories, community discovery, and a built-in AI assistant that keeps the conversation alive.

---

## 🌟 Key Features

### 🤖 **Intelligent AI Assistant**
- **Seamless Interaction:** Integrated Kimi AI that can participate in chats, answer questions, and provide assistance.
- **Auto-Reply:** Optionally set up AI to handle queries or just chat for fun.

### ⚡ **Real-time Communication**
- **Instant Messaging:** Powered by **Socket.IO** for zero-latency chat.
- **Typing Indicators:** See when friends are typing in real-time.
- **Read Receipts:** Track when your messages have been seen.
- **Message Reactions:** Express yourself with emoji reactions on any message.

### 🌐 **Global Chat Rooms**
- **Themed Channels:** Join rooms like **Tech Talk**, **Gaming**, **Music**, **Art & Design**, or just hang out in **General**.
- **Global Reach:** Connect with users from around the world instantly.

### 📸 **Status & Stories**
- **24-Hour Stories:** Share your moments with text, photos, or custom backgrounds.
- **Dynamic Content:** Automatic expiration after 24 hours to keep the feed fresh.

### 🏘️ **Communities**
- **Discover & Join:** Browse through various communities based on your interests.
- **Create Your Own:** Start a community, set privacy levels, and invite others.
- **Categorized Browsing:** Easily find groups that match your passion.

### 📞 **WebRTC Audio/Video Calls**
- **High-Quality Calling:** Crystal clear audio and video calls directly through the browser.
- **Seamless Signaling:** Integrated with Socket.IO for reliable call initiation and handling.

### 🛡️ **Advanced Authentication**
- **Multi-Method Login:** Choose between Email/Password, Mobile OTP, or Social Logins.
- **Social OAuth:** One-click login with **Google**, **GitHub**, or **Discord**.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS (optional), Zustand, Axios |
| **Backend** | Node.js, Express, Socket.IO, Passport.js |
| **Database** | MongoDB, Mongoose |
| **Real-time** | Socket.IO, WebRTC |
| **Auth** | JWT, bcryptjs, OAuth 2.0 |

---

## 🚀 Quick Start

### 📋 Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas URI)
- **Git**

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/kimichat.git
cd kimichat
```

### 2️⃣ Install Dependencies
```bash
# Install root, client, and server dependencies
npm run install-all
```

### 3️⃣ Set Up Environment Variables

#### **Server (`server/.env`)**
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional: Social Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

#### **Client (`client/.env`)**
```env
VITE_SERVER_URL=http://localhost:5000
```

### 4️⃣ Run the Application
```bash
# Start both server and client in development mode
npm run dev
```
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5173

---

## 📂 Project Structure

```text
kimichat/
├── client/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI elements
│   │   ├── context/       # Zustand Store & Auth
│   │   ├── pages/         # Main application pages
│   │   └── utils/         # API & Socket configurations
├── server/                # Node.js + Express Backend
│   ├── models/            # Mongoose Schemas
│   ├── routes/            # API Endpoints
│   ├── socket/            # Socket.IO logic
│   └── middleware/        # Auth & Error handlers
└── package.json           # Root scripts for project management
```

---

## 🔌 Socket.IO Events Reference

| Event | Description |
|---|---|
| `message:send` | Dispatch a new private message |
| `message:typing` | Broadcast typing status |
| `call:initiate` | Start a WebRTC video/audio call |
| `global:join` | Enter a global themed chat room |
| `status:new` | Notify friends of a new story update |

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the KimiChat Team
</p>
