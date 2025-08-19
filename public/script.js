// ----- DOM -----
const roomLabel = document.getElementById('roomLabel');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const approvalPopup = document.getElementById('approvalPopup');
const acceptBtn = document.getElementById('acceptBtn');
const rejectBtn = document.getElementById('rejectBtn');

const youBox = document.getElementById('youBox');
const themBox = document.getElementById('themBox');

// ----- State -----
let socket = null;
let roomCode = null;
let isHost = false;

let localStream = null;
let pc = null;

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ----- Utils -----
function setRoomBadge(code){ if(roomLabel) roomLabel.textContent = `Room — ${code}`; }
function copyLink(){
  navigator.clipboard.writeText(location.href)
    .then(()=> toast('Link copied'))
    .catch(()=> toast('Copy failed'));
}
function toast(msg){
  // lightweight toast via status-bar color flash
  roomLabel.style.color = '#00f5ff';
  roomLabel.textContent = `${roomLabel.textContent.split('—')[0]}— ${msg}`;
  setTimeout(()=> setRoomBadge(roomCode), 900);
}
function newRoom(){
  const code = Math.random().toString(36).substr(2,6).toUpperCase();
  location.href = `/room/${code}`;
}
function fullscreenYou(){ document.body.classList.add('fullscreen-you'); document.body.classList.remove('fullscreen-them'); }
function fullscreenThem(){ document.body.classList.add('fullscreen-them'); document.body.classList.remove('fullscreen-you'); }

// expose some for HTML
window.copyLink = copyLink;
window.newRoom = newRoom;
window.fullscreenYou = fullscreenYou;
window.fullscreenThem = fullscreenThem;

// ----- Page init -----
window.addEventListener('load', async () => {
  // room routing /room/XXXXXX
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'room' && parts[1]) {
    roomCode = parts[1].toUpperCase();
    setRoomBadge(roomCode);
    await startRoom();
  }
});

// ----- Start room flow -----
async function startRoom(){
  // connect to your existing backend (unchanged)
  socket = io('https://linkdrop-production.up.railway.app');

  socket.on('connect', async () => {
    try {
      // get local media
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (err) {
      console.error('Media error:', err);
      toast('Enable camera/mic');
      return;
    }
    // join room
    socket.emit('join-room', roomCode, socket.id);
  });

  socket.on('connect_error', (e) => {
    console.error('Socket error:', e);
    toast('Signaling failed');
  });

  // someone wants to join (you are host)
  socket.on('request-join', () => {
    isHost = true;
    approvalPopup.style.display = 'block';
  });

  // host accepted you
  socket.on('accepted', () => {
    if (isHost) return; // guest will get offer, host creates it separately
    toast('Accepted');
  });

  // host rejected you
  socket.on('rejected', () => {
    toast('Rejected');
    setTimeout(()=> location.href='/', 800);
  });

  // WebRTC signaling
  socket.on('offer', async (desc) => {
    // guest receives offer
    pc = createPeer();
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', roomCode, answer);
  });

  socket.on('answer', async (desc) => {
    // host receives answer
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(desc));
  });

  socket.on('ice-candidate', async (candidate) => {
    try {
      await pc?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('ICE add error', err);
    }
  });

  // approval buttons (host)
  if (acceptBtn) acceptBtn.onclick = () => {
    socket.emit('accept', roomCode);
    approvalPopup.style.display = 'none';
    createAndSendOffer(); // host creates offer
  };
  if (rejectBtn) rejectBtn.onclick = () => {
    socket.emit('reject', roomCode);
    approvalPopup.style.display = 'none';
  };
}

function createPeer(){
  const peer = new RTCPeerConnection(rtcConfig);

  peer.ontrack = (e) => {
    const stream = e.streams[0];
    if (remoteVideo.srcObject !== stream) {
      remoteVideo.srcObject = stream;
      themBox.classList.add('connected');
    }
  };

  peer.onicecandidate = (e) => {
    if (e.candidate) socket.emit('ice-candidate', roomCode, e.candidate);
  };

  return peer;
}

async function createAndSendOffer(){
  pc = createPeer();
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', roomCode, offer);
}

// ----- Controls -----
function setBtnOpacity(id, on){
  const el = document.getElementById(id);
  if (el) el.style.opacity = on ? '1' : '.55';
}
window.toggleAudio = function(){
  const t = localStream?.getAudioTracks?.()[0];
  if (!t) return;
  t.enabled = !t.enabled;
  setBtnOpacity('btnAudio', t.enabled);
  toast(t.enabled ? 'Mic on' : 'Mic off');
};
window.toggleVideo = function(){
  const t = localStream?.getVideoTracks?.()[0];
  if (!t) return;
  t.enabled = !t.enabled;
  setBtnOpacity('btnVideo', t.enabled);
  toast(t.enabled ? 'Cam on' : 'Cam off');
};
