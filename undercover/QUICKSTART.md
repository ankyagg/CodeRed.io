# 🚀 Quick Start Guide

## Setup Instructions

### Step 1: Install Backend Dependencies

```powershell
cd server
npm install
```

### Step 2: Install Frontend Dependencies

```powershell
cd client
npm install
```

### Step 3: Start Backend Server

```powershell
cd server
npm start
```

**Output:** Server runs on http://localhost:3000

### Step 4: Start Frontend (New Terminal)

```powershell
cd client
npm run dev
```

**Output:** Client runs on http://localhost:5173

### Step 5: Play!

Open http://localhost:5173 in multiple browser tabs/windows to simulate multiple players.

---

## Testing Locally

### Single Computer Testing

1. Open multiple browser tabs
2. Each tab = different player
3. Use incognito/private windows if needed

### Multiple Devices on Same Network

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `client/src/socket.js`:
   ```javascript
   const SOCKET_URL = "http://YOUR_LOCAL_IP:3000";
   ```
3. Access from other devices: `http://YOUR_LOCAL_IP:5173`

---

## Common Commands

### Backend

```powershell
# Install
cd server
npm install

# Start server
npm start

# Dev mode (auto-restart)
npm run dev
```

### Frontend

```powershell
# Install
cd client
npm install

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Troubleshooting

### "Port already in use"

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

### "Module not found"

```powershell
# Reinstall dependencies
rm -r node_modules
npm install
```

### Socket connection failed

1. Ensure backend is running first
2. Check SOCKET_URL in `client/src/socket.js`
3. Verify no firewall blocking

---

## Game Flow Quick Reference

1. **HOME** → Create/Join Room
2. **LOBBY** → Wait for players, Ready up
3. **WORD REVEAL** → See your word + match % + intel
4. **CLUE PHASE** → Give one-word clues
5. **VOTING** → Vote to eliminate
6. **RESULT** → See who was eliminated
7. Repeat 4-6 or **GAME END**

---

**Ready to play? Follow the steps above and have fun!** 🎮
