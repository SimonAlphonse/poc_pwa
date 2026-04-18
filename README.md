# P2P PWA - Peer-to-Peer Progressive Web App

A simple P2P participant status app built with React, PeerJS, and PWA capabilities.

## Features

- ✅ P2P connections using WebRTC (via PeerJS)
- ✅ No central server needed (uses PeerJS cloud signaling)
- ✅ PWA compatible (installable on mobile)
- ✅ Real-time participant status (green = online, grey = offline)
- ✅ 4-digit room codes
- ✅ Mesh topology support

## Setup & Deployment

### 1. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master
```

### 2. Enable GitHub Pages
1. Go to repo **Settings** → **Pages**
2. Select branch: `master`, folder: `/ (root)`
3. Click **Save**
4. Your app will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Usage

### To Create a Room:
1. Enter your name
2. Enter a 4-digit room code (e.g., `1234`)
3. Click **Create Room**
4. Copy your Peer ID and share it with others

### To Join a Room:
1. Enter your name
2. Enter the same 4-digit room code
3. Paste the host's Peer ID
4. Click **Join Room**

## Testing

1. Open on Device 1 → Create Room (e.g., code: `1234`)
2. Copy the Peer ID shown
3. Open on Device 2 → Enter same code `1234` → Paste Peer ID → Join
4. Both devices should see each other with green status
5. Close one device → turns grey on the other

## Technical Details

- **Framework**: React 19 + Vite
- **P2P Library**: PeerJS (WebRTC abstraction)
- **PWA**: vite-plugin-pwa
- **Signaling**: PeerJS cloud (free, no setup required)
- **Topology**: Mesh (all peers connect to all)

## Limitations

- PeerJS free cloud signaling is rate-limited (fine for POC/testing)
- For production, consider self-hosting PeerJS server
- Mobile: connection may drop if app goes to background
