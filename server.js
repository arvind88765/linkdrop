// Dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

console.log("✅ Dependencies loaded");

// Initialize app
const app = express();
const server = http.createServer(app);

// Socket.IO with CORS for your domain
const io = socketIo(server, {
  cors: {
    origin: "https://linkdrop-phi.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log("🌐 Socket.IO configured for https://linkdrop-phi.vercel.app");

// Room storage
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("join-room", (roomCode, userId) => {
    console.log(`🚪 join-room: ${roomCode}, userId: ${userId}`);

    if (!rooms[roomCode]) {
      rooms[roomCode] = { hostId: userId };
      socket.join(roomCode);
      console.log(`👑 Host created room: ${roomCode}`);
    } else if (rooms[roomCode].hostId) {
      rooms[roomCode].pendingId = userId;
      socket.join(roomCode);
      console.log(`👤 Guest joined room: ${roomCode}, awaiting approval`);
      socket.broadcast.to(rooms[roomCode].hostId).emit("request-join");
    }
  });

  socket.on("accept", (roomCode) => {
    console.log(`✅ Host accepted guest in room: ${roomCode}`);
    if (rooms[roomCode]?.pendingId) {
      const guestId = rooms[roomCode].pendingId;
      socket.broadcast.to(guestId).emit("accepted");
      console.log(`📨 Sent 'accepted' to guest: ${guestId}`);
    } else {
      console.log(`❌ No pending guest in room ${roomCode}`);
    }
  });

  socket.on("reject", (roomCode) => {
    console.log(`❌ Host rejected guest in room: ${roomCode}`);
    if (rooms[roomCode]?.pendingId) {
      socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
      delete rooms[roomCode].pendingId;
    }
  });

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

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      if (rooms[roomCode].hostId === socket.id) {
        console.log(`💀 Host disconnected. Destroying room: ${roomCode}`);
        if (rooms[roomCode].pendingId) {
          socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
        }
        delete rooms[roomCode];
      } else if (rooms[roomCode].pendingId === socket.id) {
        console.log(`🚪 Guest disconnected from room: ${roomCode}`);
        delete rooms[roomCode].pendingId;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
  console.log(`🔗 Connect from: https://linkdrop-phi.vercel.app`);
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
