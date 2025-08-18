// DOM Elements
const statusText = document.getElementById("statusText");
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
    document.getElementById("roomCode").textContent = roomCode;
    initRoom();
  }
});

// Initialize Room
async function initRoom() {
  try {
    socket = io("https://linkdrop-production.up.railway.app");

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join-room", roomCode, socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err);
      statusText.textContent = "Connection failed";
    });

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    socket.on("request-join", () => {
      isHost = true;
      statusText.textContent = "🔔 Incoming request";
      approvalPopup.style.display = "block";
    });

    socket.on("accepted", () => {
      statusText.textContent = "🟢 Connected (P2P)";
      approvalPopup.style.display = "none";
      createPeerConnection();
    });

    socket.on("rejected", () => {
      alert("Access denied.");
      window.location.href = "/";
    });

    socket.on("offer", async (desc) => {
      peerConnection = new RTCPeerConnection(config);
      localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
      peerConnection.ontrack = e => { if (remoteVideo.srcObject !== e.streams[0]) remoteVideo.srcObject = e.streams[0]; };
      peerConnection.onicecandidate = e => { if (e.candidate) socket.emit("ice-candidate", roomCode, e.candidate); };
      await peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", roomCode, answer);
    });

    socket.on("answer", (desc) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
    });

    socket.on("ice-candidate", (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

  } catch (err) {
    console.error("Init error:", err);
    statusText.textContent = "Error: " + err.message;
  }
}

// Create WebRTC Connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
  peerConnection.ontrack = e => { if (remoteVideo.srcObject !== e.streams[0]) remoteVideo.srcObject = e.streams[0]; };
  peerConnection.onicecandidate = e => { if (e.candidate) socket.emit("ice-candidate", roomCode, e.candidate); };
  peerConnection.createOffer()
    .then(o => peerConnection.setLocalDescription(o))
    .then(() => socket.emit("offer", roomCode, peerConnection.localDescription));
}

// UI Controls
function toggleAudio() {
  const track = localStream.getAudioTracks()[0];
  if (track) track.enabled = !track.enabled;
}

function toggleVideo() {
  const track = localStream.getVideoTracks()[0];
  if (track) track.enabled = !track.enabled;
}

function fullscreen() {
  document.body.requestFullscreen();
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => alert("Link copied!"));
}

function newRoom() {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  window.location.href = `/room/${code}`;
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
  statusText.textContent = "Awaiting connection...";
};
