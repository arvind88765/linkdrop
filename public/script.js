// DOM
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

// WebRTC config
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// On Load
window.addEventListener("load", () => {
  const path = window.location.pathname;
  if (path.startsWith("/room/")) {
    roomCode = path.split("/")[2];
    document.title = `LinkDrop • ${roomCode}`;
    console.log("Room code:", roomCode);
    initRoom();
  }
});

// Initialize Room
async function initRoom() {
  try {
    // Connect to Railway backend
    socket = io("https://linkdrop-production.up.railway.app");

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err);
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
    console.error("Init error:", err);
    status.textContent = "Error: " + err.message;
  }
}

// Create WebRTC Connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));

  peerConnection.ontrack = (e) => {
    if (remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
    }
  };

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", roomCode, e.candidate);
    }
  };

  peerConnection.createOffer()
    .then(o => peerConnection.setLocalDescription(o))
    .then(() => socket.emit("offer", roomCode, peerConnection.localDescription))
    .catch(err => console.error("Offer failed:", err));
}

// Signaling Handlers
// (Handled inside initRoom)

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
  document.body.requestFullscreen().catch(e => console.error(e));
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("Link copied!"))
    .catch(err => console.error("Copy failed:", err));
}

function newRoom() {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  window.location.href = `/room/${code}`;
}

// Approval
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
