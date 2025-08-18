const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express + HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for your domain
const io = socketIo(server, {
  cors: {
    origin: "https://linkdrop-phi.vercel.app", // ✅ Only allow your Vercel app
    methods: ["GET", "POST"],
    credentials: true
  },
  // Reduce timeout to detect dead clients faster
  pingTimeout: 60000,
  pingInterval: 25000
});

// In-memory room store
// Format: { roomCode: { hostId: 'abc', pendingId: 'xyz' } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Listen: User wants to join a room
  socket.on("join-room", (roomCode, userId) => {
    console.log(`🚪 join-room: ${roomCode}, userId: ${userId}`);

    if (!rooms[roomCode]) {
      // First user → Host
      rooms[roomCode] = { hostId: userId };
      socket.join(roomCode);
      console.log(`👑 Host created room: ${roomCode}`);
    } else if (rooms[roomCode].hostId) {
      // Second user → Guest
      rooms[roomCode].pendingId = userId;
      socket.join(roomCode);
      console.log(`👤 Guest joined room: ${roomCode}, awaiting approval`);

      // Notify host
      socket.broadcast.to(rooms[roomCode].hostId).emit("request-join");
    }
  });

  // Listen: Host accepts guest
  socket.on("accept", (roomCode) => {
    console.log(`✅ Host in room ${roomCode} clicked ACCEPT`);
    const room = rooms[roomCode];

    if (room && room.pendingId) {
      console.log(`📨 Broadcasting 'accepted' to guest: ${room.pendingId}`);
      socket.broadcast.to(room.pendingId).emit("accepted");
    } else {
      console.log(`❌ No pending guest in room ${roomCode}`);
    }
  });

  // Listen: Host rejects guest
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
      const room = rooms[roomCode];

      if (room.hostId === socket.id) {
        console.log(`💀 Host disconnected. Destroying room: ${roomCode}`);
        if (room.pendingId) {
          socket.broadcast.to(room.pendingId).emit("rejected");
        }
        delete rooms[roomCode];
      } else if (room.pendingId === socket.id) {
        console.log(`🚪 Guest disconnected from room: ${roomCode}`);
        delete room.pendingId;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: https://linkdrop-phi.vercel.app`);
  console.log(`📝 Waiting for clients...`);
});
