const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://yourlinkdrop.vercel.app", // ← CHANGE TO YOUR VERCCEL DOMAIN
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomCode, userId) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { hostId: userId };
      socket.join(roomCode);
    } else if (rooms[roomCode].hostId) {
      rooms[roomCode].pendingId = userId;
      socket.join(roomCode);
      socket.broadcast.to(rooms[roomCode].hostId).emit("request-join");
    }
  });

  socket.on("accept", (roomCode) => {
    if (rooms[roomCode]?.pendingId) {
      socket.broadcast.to(rooms[roomCode].pendingId).emit("accepted");
    }
  });

  socket.on("reject", (roomCode) => {
    if (rooms[roomCode]?.pendingId) {
      socket.broadcast.to(rooms[roomCode].pendingId).emit("rejected");
    }
    delete rooms[roomCode].pendingId;
  });

  socket.on("offer", (roomCode, offer) => {
    socket.broadcast.to(roomCode).emit("offer", offer);
  });

  socket.on("answer", (roomCode, answer) => {
    socket.broadcast.to(roomCode).emit("answer", answer);
  });

  socket.on("ice-candidate", (roomCode, candidate) => {
    socket.broadcast.to(roomCode).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      if (rooms[code].hostId === socket.id) {
        io.to(code).emit("rejected");
        delete rooms[code];
      } else if (rooms[code].pendingId === socket.id) {
        delete rooms[code].pendingId;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});