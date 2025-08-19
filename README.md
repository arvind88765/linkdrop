<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LinkDrop — README</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" type="image/png" href="favicon.png">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#000; --panel:#0a0a0a; --ink:#fff; --muted:#b0b0b0;
      --line:rgba(0,245,255,.22); --brand:#00f5ff; --brand-soft:rgba(0,245,255,.08);
      --code:#0b0f12;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0; background:
        radial-gradient(780px 420px at 82% 85%, rgba(0,140,255,.04), transparent),
        radial-gradient(700px 380px at 18% 18%, rgba(0,245,255,.045), transparent),
        var(--bg);
      color:var(--ink);
      font-family:'JetBrains Mono', monospace;
      line-height:1.5;
    }
    .wrap{
      max-width:1024px; margin:0 auto; padding:28px 16px 60px;
    }
    header{
      position:sticky; top:0; z-index:5;
      background:linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,.6) 60%, transparent);
      backdrop-filter:saturate(120%) blur(6px);
      border-bottom:1px solid var(--line);
      margin-bottom:20px;
    }
    .brand{
      display:flex; align-items:center; gap:10px; padding:12px 16px;
    }
    .brand .dot{
      width:14px; height:14px; border-radius:50%; background:var(--brand);
      box-shadow:0 0 12px var(--brand);
    }
    h1{font-size:24px; margin:0}
    h2{font-size:18px; margin:28px 0 8px;}
    h3{font-size:15px; margin:18px 0 6px;}
    p{color:var(--muted); margin:8px 0;}
    a{color:var(--brand); text-decoration:none}
    a:hover{text-decoration:underline}
    .tag{display:inline-block; padding:2px 8px; border:1px solid var(--line); border-radius:999px; font-size:12px; color:var(--brand); background:var(--brand-soft); margin-left:8px;}
    .toc{
      border:1px solid var(--line); border-radius:10px; background:var(--panel); padding:14px;
    }
    .toc a{display:inline-block; margin:4px 12px 4px 0}
    .card{
      border:1px solid var(--line); border-radius:12px; background:var(--panel);
      padding:16px; margin:12px 0;
    }
    code,kbd{font-family:'JetBrains Mono', monospace;}
    pre{
      position:relative; margin:12px 0; border:1px solid var(--line); border-radius:10px;
      background:var(--code); color:#d8f6ff; overflow:auto;
    }
    pre code{display:block; padding:14px;}
    .copy-btn{
      position:absolute; top:8px; right:8px; border:1px solid var(--line);
      background:var(--brand-soft); color:var(--brand); padding:6px 10px; border-radius:8px;
      cursor:pointer; font-size:12px;
    }
    ul,ol{margin:8px 0 8px 20px; color:var(--muted);}
    .grid{display:grid; gap:12px}
    @media (min-width: 860px){ .grid.cols-2{ grid-template-columns: 1fr 1fr; } }
    .tip{font-size:12px; color:#9adbe1}
    footer{margin-top:28px; padding-top:14px; border-top:1px dashed var(--line); color:var(--muted); font-size:12px;}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="dot"></div>
      <h1>LinkDrop — Instant Private Video Rooms <span class="tag">README</span></h1>
    </div>
  </header>

  <main class="wrap">
    <div class="card">
      <p><strong>LinkDrop</strong> lets you create and join private video rooms instantly. Share a link and connect — <em>no signups, no tracking, no limits</em>. Media streams are peer-to-peer via WebRTC; Socket.IO is used only for signaling.</p>
    </div>

    <div class="toc">
      <strong>Table of Contents:</strong>
      <div>
        <a href="#features">Features</a>
        <a href="#stack">Tech Stack</a>
        <a href="#structure">Project Structure</a>
        <a href="#prereqs">Prerequisites</a>
        <a href="#quickstart">Quick Start (Local)</a>
        <a href="#configure">Configure Signaling URL</a>
        <a href="#deploy">Deploy</a>
        <a href="#usage">Usage</a>
        <a href="#faq">FAQ</a>
        <a href="#turn">TURN (optional)</a>
        <a href="#assets">Assets</a>
        <a href="#highlights">Code Highlights</a>
        <a href="#contrib">Contributing</a>
        <a href="#license">License</a>
      </div>
    </div>

    <section id="features">
      <h2>✨ Features</h2>
      <ul>
        <li>1-to-1 private video calls (P2P)</li>
        <li>Create / Join flows with share &amp; copy link</li>
        <li>Desktop: side-by-side tiles, expand/swap, Picture-in-Picture</li>
        <li>Mobile: stacked tiles, big tap targets</li>
        <li>Clean neon UI, responsive, keyboard shortcuts</li>
        <li>No tracking, no history</li>
      </ul>
    </section>

    <section id="stack">
      <h2>📦 Tech Stack</h2>
      <ul>
        <li><strong>Frontend:</strong> HTML, CSS, vanilla JS</li>
        <li><strong>Signaling:</strong> Socket.IO (Node.js)</li>
        <li><strong>Media:</strong> WebRTC (<code>getUserMedia</code>, <code>RTCPeerConnection</code>)</li>
      </ul>
    </section>

    <section id="structure">
      <h2>📁 Project Structure</h2>
<pre><button class="copy-btn" data-copy="code-struct">Copy</button><code id="code-struct">/
├─ index.html         # Landing page (create/join modals + features)
├─ room.html          # Room UI (videos + controls)
├─ style.css          # Unified styles
├─ script.js          # WebRTC + signaling + UI logic
├─ server.js          # Socket.IO signaling server (no media relaying)
├─ package.json
├─ vercel.json        # (optional) Vercel config for frontend
├─ favicon.png        # Favicon (32x32 or 64x64)
├─ logo.png / logo.svg# Logo (optional)
└─ readme.html        # This file</code></pre>
    </section>

    <section id="prereqs">
      <h2>✅ Prerequisites</h2>
      <ul>
        <li>Node.js 18+ and npm/yarn/pnpm</li>
        <li>HTTPS for camera/mic in browsers (localhost allowed; production must be https)</li>
        <li>A public URL for your Socket.IO server (Railway/Render/Fly/Heroku/VPS)</li>
      </ul>
    </section>

    <section id="quickstart">
      <h2>🚀 Quick Start (Local Dev)</h2>
      <div class="grid cols-2">
        <div>
          <h3>1) Install dependencies</h3>
<pre><button class="copy-btn" data-copy="code-install">Copy</button><code id="code-install">npm install</code></pre>

          <h3>2) Start the signaling server</h3>
          <p class="tip">Runs Socket.IO locally (check your <code>server.js</code> port).</p>
<pre><button class="copy-btn" data-copy="code-server">Copy</button><code id="code-server">node server.js</code></pre>
        </div>
        <div>
          <h3>3) Serve the frontend (static)</h3>
<pre><button class="copy-btn" data-copy="code-http">Copy</button><code id="code-http"># Option A: http-server
npm i -g http-server
http-server -p 5173 .

# Option B: Vite
npm i -D vite
npx vite</code></pre>
          <p>Open the shown URL (e.g., <code>http://localhost:5173</code>). Use two browsers/profiles to simulate two users.</p>
        </div>
      </div>
      <div class="card">
        <strong>Dev tip:</strong> In <code>script.js</code>, point Socket.IO to your local server during dev:
<pre><button class="copy-btn" data-copy="code-devurl">Copy</button><code id="code-devurl">// script.js
// const SIGNAL_URL = 'http://localhost:3000';
// socket = io(SIGNAL_URL);

// Production example:
// const SIGNAL_URL = 'https://your-socket-server.example.com';
// socket = io(SIGNAL_URL);</code></pre>
      </div>
    </section>

    <section id="configure">
      <h2>🌐 Configure Signaling URL</h2>
      <p>Set the correct endpoint in <code>script.js</code>:</p>
<pre><button class="copy-btn" data-copy="code-signal">Copy</button><code id="code-signal">// DEV (local):
// const SIGNAL_URL = 'http://localhost:3000';

// PROD (deployed Socket.IO server):
const SIGNAL_URL = 'https://your-socket-server.example.com';

socket = io(SIGNAL_URL);</code></pre>
      <p class="tip">Your current code might be using a sample Railway URL. Replace it with your own when you deploy.</p>
    </section>

    <section id="deploy">
      <h2>🚢 Deploy</h2>
      <h3>Frontend (Vercel)</h3>
      <ol>
        <li>Push repo to GitHub, import it in Vercel.</li>
        <li>Ensure <code>index.html</code>, <code>room.html</code>, <code>style.css</code>, <code>script.js</code> are in the root.</li>
        <li>Place <code>favicon.png</code> at root and include in both pages:
<pre><button class="copy-btn" data-copy="code-favicon">Copy</button><code id="code-favicon">&lt;link rel="icon" type="image/png" href="/favicon.png"&gt;</code></pre>
        </li>
        <li>Deploy. Then update <code>SIGNAL_URL</code> in <code>script.js</code> to your Socket.IO server URL.</li>
      </ol>

      <h3>Signaling Server (Railway / Render / etc.)</h3>
      <ul>
        <li>Create a new Node.js service, deploy your <code>server.js</code>.</li>
        <li>Expose the port (<code>process.env.PORT</code> if you use it).</li>
        <li>Copy the public URL and set it as <code>SIGNAL_URL</code> in <code>script.js</code>.</li>
      </ul>
      <p class="tip">For tough NATs, add a TURN server (see section below).</p>
    </section>

    <section id="usage">
      <h2>🧭 Usage</h2>
      <ul>
        <li>Open the site.</li>
        <li><strong>Create Room</strong> → modal shows code + link → <em>Share</em> or <em>Copy</em> → <em>Enter Room</em>.</li>
        <li>Share the link with your friend to join.</li>
      </ul>
      <h3>In the room</h3>
      <ul>
        <li>On-video buttons: <em>expand</em> a tile, <em>⇆ swap</em> tiles.</li>
        <li>Floating controls: mic / camera toggles, Picture-in-Picture, page fullscreen.</li>
        <li>Double-click a video to toggle tile fullscreen; press <kbd>Esc</kbd> to exit.</li>
      </ul>
      <h3>Shortcuts</h3>
      <ul>
        <li>Landing: <kbd>C</kbd> create, <kbd>J</kbd> join</li>
        <li>Room: <kbd>Esc</kbd> exit tile fullscreen</li>
      </ul>
    </section>

    <section id="faq">
      <h2>❓ FAQ</h2>
      <p><strong>Is it only 1-to-1?</strong><br/>Yes by default. You can do 3–4 people with P2P mesh (each connects to each), but it gets heavy. For larger rooms, use an SFU (LiveKit, mediasoup, Janus, Jitsi).</p>
      <p><strong>Is my media private?</strong><br/>Yes. Media is P2P between browsers. The signaling server only exchanges connection metadata.</p>
      <p><strong>Is HTTPS required?</strong><br/>Yes in production (for camera/mic). <code>localhost</code> is allowed during development.</p>
      <p><strong>Camera doesn’t start?</strong><br/>Check permissions/HTTPS and that no other app uses the camera. Look at DevTools console for errors.</p>
      <p><strong>Peers can’t connect?</strong><br/>Strict/corporate networks may block direct P2P. Add a TURN server.</p>
    </section>

    <section id="turn">
      <h2>🔒 TURN (optional, for tough networks)</h2>
      <p>Add a TURN server to your RTC config in <code>script.js</code>:</p>
<pre><button class="copy-btn" data-copy="code-turn">Copy</button><code id="code-turn">const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Example TURN:
    // { urls: 'turn:your-turn.example.com:3478', username: 'user', credential: 'pass' }
  ]
};</code></pre>
    </section>

    <section id="assets">
      <h2>🎨 Assets (favicon / logo)</h2>
      <ul>
        <li>Place <code>favicon.png</code> (32×32 or 64×64) at project root.</li>
        <li>Add to both pages’ <code>&lt;head&gt;</code>:
<pre><button class="copy-btn" data-copy="code-fav2">Copy</button><code id="code-fav2">&lt;link rel="icon" type="image/png" href="/favicon.png"&gt;</code></pre>
        </li>
        <li>Optional: <code>logo.png</code> or <code>logo.svg</code> anywhere you want to show branding.</li>
      </ul>
    </section>

    <section id="highlights">
      <h2>🧱 Code Highlights</h2>
      <ul>
        <li>Create-room modal: generate code → share/copy → enter room.</li>
        <li>Room UI: side-by-side desktop, stacked mobile, expand &amp; swap on tiles.</li>
        <li>Double-click tile fullscreen; <kbd>Esc</kbd> to exit; Picture-in-Picture for convenience.</li>
      </ul>
    </section>

    <section id="contrib">
      <h2>🤝 Contributing</h2>
      <p>PRs welcome. Keep it vanilla, lightweight, and privacy-first.</p>
    </section>

    <section id="license">
      <h2>📄 License</h2>
      <p>MIT</p>
    </section>

    <footer>
      <p>© LinkDrop — built for instant, private rooms.</p>
    </footer>
  </main>

  <script>
    // copy buttons for code blocks
    document.querySelectorAll('.copy-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-copy');
        const code = document.getElementById(id)?.innerText || '';
        if (!code) return;
        navigator.clipboard.writeText(code).then(()=>{
          const old = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(()=> btn.textContent = old, 1000);
        });
      });
    });
  </script>
</body>
</html>
