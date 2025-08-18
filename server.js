const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for your frontend
const io = socketIo(server, {
  cors: {
    origin: "https://linkdrop-phi.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// In-memory room tracking
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Join room
  socket.on("join-room", (roomCode, userId) => {
    if (!userId) {
      console.warn("❌ join-room: userId is", userId);
      return;
    }

    if (!rooms[roomCode]) {
      // Host creates room
      rooms[roomCode] = { hostId: userId };
      socket.join(roomCode);
      console.log(`👑 Host created room: ${roomCode}`);
    } else if (rooms[roomCode].hostId) {
      // Guest joins
      rooms[roomCode].pendingId = userId;
      socket.join(roomCode);
      console.log(`👤 Guest joined room: ${roomCode}`);
      socket.broadcast.to(rooms[roomCode].hostId).emit("request-join");
    }
  });

  // Host accepts guest
  socket.on("accept", (roomCode) => {
    console.log(`✅ Host accepted guest in room: ${roomCode}`);
    if (rooms[roomCode]?.pendingId) {
      socket.broadcast.to(rooms[roomCode].pendingId).emit("accepted");
    }
  });

  // Host rejects guest
  socket.on("reject", (roomCode) => {
    console.log(`❌ Host rejected guest in room: ${roomCode}`);
    if (rooms[roomCode]?.pendingId) {
      socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
      delete rooms[roomCode].pendingId;
    }
  });

  // WebRTC Signaling
  socket.on("offer", (roomCode, offer) => {
    console.log(`📤 Offer sent in room: ${roomCode}`);
    socket.broadcast.to(roomCode).emit("offer", offer);
  });

  socket.on("answer", (roomCode, answer) => {
    console.log(`📥 Answer sent in room: ${roomCode}`);
    socket.broadcast.to(roomCode).emit("answer", answer);
  });

  socket.on("ice-candidate", (roomCode, candidate) => {
    console.log(`🌐 ICE candidate in room: ${roomCode}`);
    socket.broadcast.to(roomCode).emit("ice-candidate", candidate);
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      if (rooms[roomCode].hostId === socket.id) {
        console.log(`💀 Host left. Destroying room: ${roomCode}`);
        if (rooms[roomCode].pendingId) {
          socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
        }
        delete rooms[roomCode];
      } else if (rooms[roomCode].pendingId === socket.id) {
        console.log(`🚪 Guest left room: ${roomCode}`);
        delete rooms[roomCode].pendingId;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
  console.log(`🌐 Allowed origin: https://linkdrop-phi.vercel.app`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM: Shutting down gracefully...');
  server.close(() => {
    console.log('💥 HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT: Shutting down...');
  process.exit(0);
});
