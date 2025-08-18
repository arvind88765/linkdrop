const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for your Vercel app
const io = socketIo(server, {
  cors: {
    origin: "https://linkdrop-phi.vercel.app", // ✅ Only allow your domain
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory room tracking
const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins a room
  socket.on("join-room", (roomCode, userId) => {
    if (!rooms[roomCode]) {
      // First user (host) creates the room
      rooms[roomCode] = { hostId: userId };
      socket.join(roomCode);
      console.log(`Host created room: ${roomCode}`);
    } else if (rooms[roomCode].hostId) {
      // Second user (guest) requests to join
      rooms[roomCode].pendingId = userId;
      socket.join(roomCode);
      // Notify host of incoming request
      socket.broadcast.to(rooms[roomCode].hostId).emit("request-join");
      console.log(`Guest requested to join room: ${roomCode}`);
    }
  });

  // Host accepts the guest
  socket.on("accept", (roomCode) => {
    if (rooms[roomCode]?.pendingId) {
      console.log(`Host accepted guest in room: ${roomCode}`);
      socket.broadcast.to(rooms[roomCode].pendingId).emit("accepted");
    }
  });

  // Host rejects the guest
  socket.on("reject", (roomCode) => {
    if (rooms[roomCode]?.pendingId) {
      console.log(`Host rejected guest in room: ${roomCode}`);
      socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
      delete rooms[roomCode].pendingId;
    }
  });

  // WebRTC Signaling: Offer
  socket.on("offer", (roomCode, offer) => {
    socket.broadcast.to(roomCode).emit("offer", offer);
  });

  // WebRTC Signaling: Answer
  socket.on("answer", (roomCode, answer) => {
    socket.broadcast.to(roomCode).emit("answer", answer);
  });

  // WebRTC Signaling: ICE Candidates
  socket.on("ice-candidate", (roomCode, candidate) => {
    socket.broadcast.to(roomCode).emit("ice-candidate", candidate);
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      if (room.hostId === socket.id) {
        // Host left — notify guest and clear room
        if (room.pendingId) {
          socket.broadcast.to(room.pendingId).emit("rejected");
        }
        delete rooms[roomCode];
        console.log(`Room destroyed (host left): ${roomCode}`);
      } else if (room.pendingId === socket.id) {
        // Guest left
        delete rooms[roomCode].pendingId;
        console.log(`Guest disconnected from room: ${roomCode}`);
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
