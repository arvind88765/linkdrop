# LinkDrop — Connect. Privately.

A minimalist, secure P2P video connection portal.  
No chat. No tracking. No noise.  
Just you and the person you want to connect with — through a private room link.

## 🔗 Features

- ✅ **Create a Room** – One-click room generation with a 6-digit code
- ✅ **Host Approval** – Guest must be accepted before connecting
- ✅ **Peer-to-Peer Video** – WebRTC ensures direct, private video streaming
- ✅ **Copy Link** – Share your room easily with one click
- ✅ **No Sign-Up** – Fully anonymous, instant access
- ✅ **Mobile & Desktop Friendly** – Clean, responsive design
- ✅ **Silent & Focused** – No distractions, just connection

## 🛠️ Tech Stack

- **Frontend** – HTML, CSS, JavaScript (no frameworks)
- **WebRTC** – Real-time peer-to-peer video
- **Signaling** – Socket.IO for connection negotiation
- **Frontend Hosting** – [Vercel](https://vercel.com) (free, fast, global CDN)
- **Backend Hosting** – [Railway](https://railway.app) (Node.js + Socket.IO server)

## 🌐 How It Works

1. **Create Room** – Click "CREATE ROOM" to generate a unique 6-digit link
2. **Share Link** – Copy and send the link to someone
3. **Join & Request** – They open the link and request to join
4. **Approve** – You accept or reject the request
5. **Connect** – Once approved, P2P video starts instantly

No data is stored. No logs. No history.

## 🚀 Deployment

### Frontend
Deployed on [Vercel](https://vercel.com):  
👉 [https://linkdrop-phi.vercel.app](https://linkdrop-phi.vercel.app)

- Serves static files (`index.html`, `room.html`, `style.css`, `script.js`)
- Uses `vercel.json` to route `/room/ABC123` correctly

### Backend
Hosted on [Railway](https://railway.app):  
👉 `linkdrop-production.up.railway.app`

- Node.js + Express + Socket.IO
- Handles signaling for WebRTC (offer, answer, ICE)
- CORS secured for `linkdrop-phi.vercel.app`
- Real-time room management with host/guest logic

## 📂 Project Structure
```
linkdrop/
├── public/
│ ├── index.html # Landing page
│ ├── room.html # Video room
│ ├── style.css # Minimalist terminal-style UI
│ ├── script.js # WebRTC + UI logic
│ └── vercel.json # URL rewrites
├── server.js # Socket.IO signaling server
├── package.json # Backend dependencies
```

## 🎯 Design Philosophy

Inspired by clean, powerful tools like `terminal.co`, LinkDrop focuses on:
- **Minimalism** – Only what’s needed
- **Privacy** – No third parties, no data collection
- **Control** – Host decides who connects
- **Simplicity** – No learning curve

## 📢 Future Ideas
- Add QR code for mobile sharing
- Picture-in-Picture support
- End-to-end encryption (E2EE) metadata
- Dark mode toggle

---

> **LinkDrop** — Where connection is private by design.
