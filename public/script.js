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
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// On Load
window.addEventListener("load", () => {
  const path = window.location.pathname;
  if (path.startsWith("/room/")) {
    roomCode = path.split("/")[2];
    document.title = `LinkDrop • ${roomCode}`;
    initRoom();
  }
});

async function initRoom() {
  // Connect to your Railway backend
  socket = io("https://linkdrop-production.up.railway.app"); // ← CHANGE THIS LATER

  // Get camera
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
  } catch (err) {
    console.error("Camera access denied", err);
    status.textContent = "Camera access denied";
  }

  // Join room
  socket.emit("join-room", roomCode, socket.id);

  socket.on("user-joined", () => {
    if (!isHost) {
      status.textContent = "Request sent. Awaiting approval...";
    }
  });

  socket.on("request-join", () => {
    isHost = true;
    status.textContent = "Incoming request...";
    approvalPopup.style.display = "block";
  });

  socket.on("accepted", () => {
    status.textContent = "🟢 Connected (P2P)";
    approvalPopup.style.display = "none";
    createPeerConnection();
  });

  socket.on("rejected", () => {
    alert("Access denied.");
    window.location = "/";
  });
}

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

  peerConnection.createOffer().then(o => peerConnection.setLocalDescription(o))
    .then(() => {
      socket.emit("offer", roomCode, peerConnection.localDescription);
    });
}

// Signaling handlers
socket?.on("offer", async (desc) => {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));

  peerConnection.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.emit("ice-candidate", roomCode, e.candidate);
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", roomCode, answer);
});

socket?.on("answer", (desc) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
});

socket?.on("ice-candidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// UI Controls
function toggleAudio() {
  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  document.querySelector('.controls [title="Mute Audio"]').style.color = track.enabled ? "#fff" : "#f00";
}

function toggleVideo() {
  const track = localStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
}

function fullscreen() {
  document.body.requestFullscreen();
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
}

function newRoom() {
  window.location = `/room/${Math.random().toString(36).substr(2,6).toUpperCase()}`;
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
