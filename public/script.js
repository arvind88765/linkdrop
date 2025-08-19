// ===== DOM =====
const roomLabel = document.getElementById('roomLabel');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const approvalPopup = document.getElementById('approvalPopup');
const acceptBtn = document.getElementById('acceptBtn');
const rejectBtn = document.getElementById('rejectBtn');
const youBox = document.getElementById('youBox');
const themBox = document.getElementById('themBox');

// ===== State =====
let socket = null;
let roomCode = null;
let isHost = false;
let localStream = null;
let pc = null;

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ===== Utils =====
function setRoomBadge(code){ if(roomLabel) roomLabel.textContent = `Room — ${code}`; }
function toast(msg){
  const base = `Room — ${roomCode}`;
  if (roomLabel){
    roomLabel.textContent = `${base}   • ${msg}`;
    setTimeout(()=> setRoomBadge(roomCode), 1200);
  }
}
function copyLink(){
  navigator.clipboard.writeText(location.href)
    .then(()=> toast('Link copied'))
    .catch(()=> toast('Copy failed'));
}
function newRoom(){
  const code = Math.random().toString(36).substr(2,6).toUpperCase();
  location.href = `/room/${code}`;
}
function fullscreenPage(){
  (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())
    .catch(()=>{});
}
function enterTileFullscreen(target){
  document.body.classList.remove('fullscreen-you','fullscreen-them');
  if (target === 'you') document.body.classList.add('fullscreen-you');
  if (target === 'them') document.body.classList.add('fullscreen-them');
}
function exitTileFullscreen(){
  document.body.classList.remove('fullscreen-you','fullscreen-them');
}
async function pip(){
  const v = remoteVideo?.srcObject ? remoteVideo : localVideo;
  if (!v) return;
  try { await v.requestPictureInPicture(); } catch {}
}
function swapVideos(){
  const parent = youBox.parentElement;
  if (youBox.nextElementSibling === themBox) parent.insertBefore(themBox, youBox);
  else parent.insertBefore(youBox, themBox);
}

// Expose for HTML
window.copyLink = copyLink;
window.newRoom = newRoom;
window.fullscreenPage = fullscreenPage;
window.pip = pip;

// ===== Init =====
window.addEventListener('load', async () => {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'room' && parts[1]) {
    roomCode = parts[1].toUpperCase();
    setRoomBadge(roomCode);
    await startRoom();
  }

  document.querySelectorAll('.v-action.expand').forEach(btn=>{
    btn.addEventListener('click', () => enterTileFullscreen(btn.dataset.target));
  });

  const swapBtn = document.querySelector('.v-action.swap');
  if (swapBtn) swapBtn.addEventListener('click', swapVideos);

  [localVideo, remoteVideo].forEach((v)=>{
    v?.addEventListener('dblclick', ()=>{
      if (document.body.classList.contains('fullscreen-you') || document.body.classList.contains('fullscreen-them')) {
        exitTileFullscreen();
      } else {
        enterTileFullscreen(v === localVideo ? 'you' : 'them');
      }
    });
  });

  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') exitTileFullscreen(); });
});

// ===== Signaling & WebRTC (backend unchanged) =====
async function startRoom(){
  socket = io('https://linkdrop-production.up.railway.app');

  socket.on('connect', async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (err) {
      console.error('Media error:', err);
      toast('Enable camera/mic');
      return;
    }
    socket.emit('join-room', roomCode, socket.id);
  });

  socket.on('connect_error', (e) => {
    console.error('Socket error:', e);
    toast('Signaling failed');
  });

  socket.on('request-join', () => {
    isHost = true;
    if (approvalPopup) approvalPopup.style.display = 'block';
  });

  socket.on('accepted', () => { toast('Accepted'); });
  socket.on('rejected', () => { toast('Rejected'); setTimeout(()=> location.href='/', 900); });

  socket.on('offer', async (desc) => {
    pc = createPeer();
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', roomCode, answer);
  });

  socket.on('answer', async (desc) => {
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(desc));
  });

  socket.on('ice-candidate', async (candidate) => {
    try { await pc?.addIceCandidate(new RTCIceCandidate(candidate)); } catch (err) { console.error('ICE add error', err); }
  });

  if (acceptBtn) acceptBtn.onclick = () => {
    socket.emit('accept', roomCode);
    approvalPopup.style.display = 'none';
    createAndSendOffer();
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

// ===== Mic / Cam toggles =====
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
