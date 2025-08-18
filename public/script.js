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

// WebRTC config
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// On Page Load
window.addEventListener("load", () => {
  const path = window.location.pathname;
  if (path.startsWith("/room/")) {
    roomCode = path.split("/")[2];
    document.title = `LinkDrop • ${roomCode}`;
    console.log("🚀 Room code:", roomCode);
    initRoom();
  }
});

// Initialize Room
async function initRoom() {
  try {
    // Connect to your Railway backend
    socket = io("https://linkdrop-production.up.railway.app");

    // Wait for connection before doing anything
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join-room", roomCode, socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      status.textContent = "Connection failed. Check your network.";
    });

    // Get camera
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Listen for events
    socket.on("request-join", () => {
      console.log("🔔 Incoming connection request");
      isHost = true;
      status.textContent = "🔔 Incoming request";
      approvalPopup.style.display = "block";
    });

    socket.on("accepted", () => {
      console.log("✅ Connection accepted. Starting WebRTC...");
      status.textContent = "🟢 Connected (P2P)";
      approvalPopup.style.display = "none";
      if (isHost) {
        createPeerConnection();
      }
    });

    socket.on("rejected", () => {
      console.log("❌ Connection rejected");
      alert("Access denied.");
      window.location.href = "/";
    });

    // WebRTC Signaling Listeners
    socket.on("offer", async (desc) => {
      console.log("📥 Received offer from host");
      peerConnection = new RTCPeerConnection(config);
      localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));

      peerConnection.ontrack = (e) => {
        if (remoteVideo.srcObject !== e.streams[0]) {
          console.log("📹 Remote stream received");
          remoteVideo.srcObject = e.streams[0];
        }
      };

      peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", roomCode, e.candidate);
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", roomCode, answer);
    });

    socket.on("answer", (desc) => {
      console.log("📥 Received answer from guest");
      peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
    });

    socket.on("ice-candidate", (candidate) => {
      console.log("🌐 ICE candidate received");
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

  } catch (err) {
    console.error("❌ initRoom error:", err);
    status.textContent = "Error: " + err.message;
  }
}

// Create WebRTC Peer Connection (Host only)
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (e) => {
    if (remoteVideo.srcObject !== e.streams[0]) {
      console.log("📹 Remote stream received");
      remoteVideo.srcObject = e.streams[0];
    }
  };

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", roomCode, e.candidate);
    }
  };

  peerConnection.createOffer()
    .then(offer => {
      console.log("📤 Creating offer...");
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      socket.emit("offer", roomCode, peerConnection.localDescription);
    })
    .catch(err => console.error("❌ Offer failed:", err));
}

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
  document.body.requestFullscreen().catch(e => console.error("Fullscreen error:", e));
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

// Approval Actions
acceptBtn.onclick = () => {
  console.log("📤 Host clicked ACCEPT for room:", roomCode);
  socket.emit("accept", roomCode);
  approvalPopup.style.display = "none";
  createPeerConnection();
};

rejectBtn.onclick = () => {
  console.log("❌ Host clicked REJECT for room:", roomCode);
  socket.emit("reject", roomCode);
  approvalPopup.style.display = "none";
  status.textContent = "Awaiting connection...";
};
