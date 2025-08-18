// DOM Elements
const status = document.getElementById("status");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const approvalPopup = document.getElementById("approvalPopup");
const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");

// State
let roomCode = null;
let isHost = false;
let socket = null;
let localStream = null;
let peerConnection = null;

// STUN server (P2P)
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// On Page Load
window.addEventListener("load", () => {
  const path = window.location.pathname;
  if (path.startsWith("/room/")) {
    roomCode = path.split("/")[2];
    document.title = `LinkDrop • ${roomCode}`;
    console.log("Room code:", roomCode);
    initRoom();
  }
});

// Initialize Room & Socket
async function initRoom() {
  try {
    // ✅ FIXED: No spaces, clean URL
    socket = io("https://linkdrop-production.up.railway.app");

    // Debug: Check if socket connects
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err);
      status.textContent = "Connection failed. Check console.";
    });

    // Get camera
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Join room
    socket.emit("join-room", roomCode, socket.id);
    status.textContent = "Waiting for peer...";

    // Listen for events
    socket.on("user-joined", () => {
      if (!isHost) {
        status.textContent = "Request sent. Awaiting approval...";
      }
    });

    socket.on("request-join", () => {
      isHost = true;
      status.textContent = "🔔 Incoming request";
      approvalPopup.style.display = "block";
    });

    socket.on("accepted", () => {
      status.textContent = "🟢 Connected (P2P)";
      approvalPopup.style.display = "none";
      createPeerConnection();
    });

    socket.on("rejected", () => {
      alert("Access denied.");
      window.location.href = "/";
    });

  } catch (err) {
    console.error("Error in initRoom:", err);
    status.textContent = "Error: " + err.message;
  }
}

// Create WebRTC Peer Connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  // Send local tracks
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Send ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", roomCode, event.candidate);
    }
  };

  // Create offer
  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      socket.emit("offer", roomCode, peerConnection.localDescription);
    })
    .catch(err => console.error("Offer error:", err));
}

// Signaling Listeners (must be after socket is defined)
socket = null; // Remove this line if present — already declared

// These listeners stay in initRoom or after socket is ready
// They are now safely inside initRoom or bound after connection

// UI Controls
function toggleAudio() {
  const track = localStream.getAudioTracks()[0];
  if (track) {
    track.enabled = !track.enabled;
    document.querySelector('.controls [title="Mute Audio"]').style.color = track.enabled ? "#fff" : "#f00";
  }
}

function toggleVideo() {
  const track = localStream.getVideoTracks()[0];
  if (track) {
    track.enabled = !track.enabled;
    document.querySelector('.controls [title="Stop Camera"]').style.color = track.enabled ? "#fff" : "#666";
  }
}

function fullscreen() {
  if (document.body.requestFullscreen) {
    document.body.requestFullscreen();
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("Link copied!"))
    .catch(err => console.error("Copy failed:", err));
}

function newRoom() {
  const newCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  window.location.href = `/room/${newCode}`;
}

// Approval Actions
acceptBtn.onclick = () => {
  socket.emit("accept", roomCode);
  approvalPopup.style.display = "none";
  createPeerConnection();
};

rejectBtn.onclick = () => {
  socket.emit("reject", roomCode);
  approvalPopup.style.display = "none";
  status.textContent = "Awaiting connection...";
};
