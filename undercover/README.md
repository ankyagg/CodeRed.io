# 🎮 ShadowWord - Multiplayer Social Deduction Game

A real-time multiplayer social deduction game with paranoia mechanics, hidden imposters, asymmetric intel, and randomized similarity percentages.

## 🎯 Game Concept

Players join a room and receive a secret word:

- **Most players** receive the TRUE word (Civilians)
- **1-2 players** receive SIMILAR words (Imposters)

**TWIST:** Imposters DON'T KNOW they are imposters!

## ✨ Key Features

### 1. **Random Match Percentage (Paranoia System)**

Every player sees a "Match %" value (72-98%), with one random player receiving a suspiciously low value (55-70%). This creates paranoia and distrust.

### 2. **Asymmetric Intel System**

Players receive one-directional intel about other players:

- "Intel: Player X is likely CIVILIAN"
- Only reveals civilians (never imposters)
- Asymmetric distribution

### 3. **Hidden Imposters**

Players only know their own word. They never know:

- If they are an imposter
- Who the imposters are

### 4. **Game Flow**

1. **Lobby** - Players join and ready up
2. **Word Reveal** - Receive word, match %, and intel
3. **Clue Phase** - Players give one-word clues
4. **Voting Phase** - Vote to eliminate suspects
5. **Result Phase** - See who was eliminated
6. Game continues until civilians eliminate all imposters or imposters control the vote

## 🛠️ Tech Stack

### Backend

- Node.js
- Express
- Socket.IO

### Frontend

- React (Vite)
- TailwindCSS
- Socket.IO Client

## 📦 Installation & Setup

### Prerequisites

- Node.js 16+ installed
- Two terminal windows

### Backend Setup

1. Navigate to server folder:

```powershell
cd server
```

2. Install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

Server will run on `http://localhost:3000`

### Frontend Setup

1. Open a NEW terminal and navigate to client folder:

```powershell
cd client
```

2. Install dependencies:

```powershell
npm install
```

3. Start the development server:

```powershell
npm run dev
```

Client will run on `http://localhost:5173`

## 🎮 How to Play

1. **Create a Room**
   - Click "Create Room" and enter your name
   - Share the room code with friends

2. **Join a Room**
   - Click "Join Room"
   - Enter room code and your name
   - Click "Ready"

3. **Start Game** (Host only)
   - Wait for 3+ players
   - All players must be ready
   - Click "Start Game"

4. **Play**
   - Receive your word and match percentage
   - Give clues about your word
   - Figure out who has different words
   - Vote to eliminate suspects

5. **Win Conditions**
   - **Civilians win**: Eliminate all imposters
   - **Imposters win**: Equal or outnumber civilians

## 🏗️ Project Structure

```
undercover/
├── server/
│   ├── index.js           # Server entry point
│   ├── gameLogic.js       # Game mechanics
│   ├── socketHandler.js   # Socket events
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.jsx        # Main app component
    │   ├── socket.js      # Socket configuration
    │   ├── components/    # Reusable components
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   └── PlayerAvatar.jsx
    │   └── screens/       # Game screens
    │       ├── HomeScreen.jsx
    │       ├── LobbyScreen.jsx
    │       ├── WordRevealScreen.jsx
    │       ├── CluePhaseScreen.jsx
    │       ├── VotingPhaseScreen.jsx
    │       ├── ResultPhaseScreen.jsx
    │       └── GameEndScreen.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## 🔧 Configuration

### Change Server Port

Edit `server/index.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Change Client Port

Edit `client/vite.config.js`:

```javascript
server: {
  port: 5173;
}
```

### Update Socket URL

Edit `client/src/socket.js`:

```javascript
const SOCKET_URL = "http://localhost:3000";
```

## 🎨 Game Mechanics Details

### Word Assignment

- System randomly selects a word pair
- Civilians get the true word
- Imposters get similar words
- 1 imposter for 3-4 players
- 2 imposters for 5+ players

### Match Percentage Algorithm

1. Assign all players 80-98%
2. Select one random player
3. Override with 55-70%
4. Add ±3% randomization

### Intel Generation

1. Get list of all civilians
2. Shuffle players
3. Randomly assign 30-60% of players to receive intel
4. Each recipient gets one random civilian target

## 🚀 Features

- ✅ Real-time multiplayer
- ✅ Room-based system
- ✅ No database (in-memory state)
- ✅ Responsive UI
- ✅ Dark theme
- ✅ Professional animations
- ✅ Host controls
- ✅ Ready system
- ✅ Turn-based clues
- ✅ Vote tracking
- ✅ Game state management

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Connection Issues

- Ensure server is running first
- Check console for errors
- Verify ports in socket.js match server

### Players Not Syncing

- Refresh the page
- Rejoin the room
- Check network connection

## 📝 Notes

- Minimum 3 players required
- Maximum tested up to 10 players
- Game resets to lobby after completion
- Host controls game flow
- All game state is in-memory (resets on server restart)

## 🎯 Future Enhancements

Potential features to add:

- Timer for clue phase
- Chat system
- Player statistics
- Custom word packs
- Spectator mode
- Audio effects
- Animations
- Mobile optimization

## 📄 License

This project is open source and available for hackathons and educational purposes.

---

**Built with ❤️ for multiplayer chaos and paranoia!**
