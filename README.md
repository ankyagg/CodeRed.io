# 🔴 CodeRed.io: The Ultimate Multiplayer Game Hub

[![Demo](https://img.shields.io/badge/demo-live-green)](https://codered-io.onrender.com) [![License](https://img.shields.io/badge/license-MIT-blue)](#license)

A unified gateway for **four real‑time multiplayer games**, deployed on a single port with micro‑services architecture, reverse proxy routing, and a custom orchestrator.

> This repository powered our award‑winning entry at **DevHacks 2025**.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
   * [Gateway](#gateway)
   * [Orchestrator](#orchestrator)
3. [Games](#games)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Deployment](#deployment)
7. [Development](#development)
8. [Contributing](#contributing)
9. [Team](#team)
10. [License](#license)

---

## 🎯 Overview
CodeRed.io is a **modular platform** where each game runs in its own Node.js service behind a shared Express gateway. By routing all traffic through a single port, we eliminate CORS headaches, simplify deployment, and deliver a seamless experience for players across genres.

---

## 🏗️ Architecture

### Gateway
The entrypoint to the entire platform is `hub.js`, an Express 5 server that acts as a **reverse proxy**. Requests arriving on port 3000 are inspected and forwarded based on URL prefixes. The proxy uses `http-proxy-middleware` for HTTP routes and the native `ws` package for WebSocket tunnels.

Configuration lives in `hub.config.js` (loadable with `require`) and defines:

- **route table** mapping prefixes to targets (host:port)
- **CORS policy** (wildcard for development, locked-down in production)
- **logging level** (morgan middleware for access logs)

Sample snippet:
```js
// hub.config.js
module.exports = {
  routes: [
    {prefix: '/survival', target: 'http://localhost:4001'},
    {prefix: '/darkroom', target: 'http://localhost:4002'},
    {prefix: '/hoop-ws', target: 'ws://localhost:4003'},
    {prefix: '/escape', target: 'http://localhost:4004'},
  ],
  port: process.env.PORT || 3000,
};
```

Path table:

| Path        | Destination                  | Protocol | Notes |
|-------------|------------------------------|----------|-------|
| `/survival` | Survival sandbox service     | HTTP     | Express + Socket.IO |
| `/darkroom` | 3D horror engine service     | HTTP     | React Three Fiber assets served statically |
| `/hoop-ws`  | Physics engine (ws only)     | WebSocket| High‑throughput `ws` server |
| `/escape`   | Escape room service          | HTTP     | State sync and WebRTC signaling |

If a backend crashes or is unreachable the gateway returns a 502 and logs a stack trace to `logs/hub.log` (rotating daily). Health‑check endpoints (`/health`) are queried every 5s by the orchestrator.

### Orchestrator
`master.js` is a lightweight process manager built on `child_process.fork`. It reads `services.json` which specifies each game subdirectory and the command to start it.

Key features:

- **Dynamic port assignment**: unused ports in the 4000–5000 range are reserved at start and injected via `PORT` env var.
- **Automatic restart**: crash events trigger a 3‑attempt backoff before giving up and emailing the dev team (via SendGrid API using `MAILER_API_KEY`).
- **Logging**: stdout/stderr of each child is prefixed and written to `logs/{service}.log`.
- **Graceful shutdown**: SIGINT/SIGTERM triggers children to close sockets before exit.

Example `services.json`:
```json
[
  {"name":"hub","dir":"."},
  {"name":"survival","dir":"backend/survival"},
  {"name":"darkroom","dir":"backend/darkroom"},
  {"name":"hoop","dir":"backend/hoop"},
  {"name":"escape","dir":"backend/escape"}
]
```

Developers can run an individual game without the orchestrator by navigating to its folder and executing `npm run start`; the orchestrator simply wraps those commands.

### Networking Summary
Internally, the architecture uses a star topology: the hub is the single publicly exposed node and all game servers bind only to `127.0.0.1`. This prevents accidental exposure of service ports and simplifies firewall rules when deploying to cloud providers.

Environment variables used across services:

- `PORT` – port to listen on (assigned by orchestrator or set manually)
- `MONGO_URI` – connection string for MongoDB Atlas
- `NODE_ENV` – `development` | `production` (controls logging, caching, asset bundling)
- `JWT_SECRET` – secret used for signing auth tokens (escape room)

Troubleshooting network issues: check `logs/hub.log` for proxy errors, and use `curl -v http://localhost:3000/health` to verify end‑to‑end connectivity.

---

## 🎮 Games
A quick summary of each experience.  Detailed design docs live in `/docs`.

### 🌑 Dark Room Survival (3D Horror)
- Built with **React Three Fiber**
- 60‑second day/night cycle, AI "Managers" hunt players outside light
- Custom loader synchronizes ~100 MB of 3D assets directly to GPU buffers

### 🧩 Escape Room: The Manor
- Co‑op puzzle with 8 sequential stages
- Real‑time `GameState` sync triggers animations across clients
- Chat + WebRTC voice chat integrated for teamwork

### 🏀 Hoop‑4 (Physics Multiplayer)
- Turn‑based basketball meets Connect‑4
- Client uses **Matter.js** for aiming predictions; server validates results
- Procedural 2D canvas rendering supports dynamic skins

### 🌲 Survival Sandbox (Open World)
- Tile‑based shared map with delta updates (changed tiles only)
- Bandwidth reduction >90% compared to full map sync

### 🕵️ Undercover (Stealth Multiplayer)
- Social deduction style minigame with hidden roles and objective syncing
- Built with React + Tailwind front end, Socket.IO for lobby/state management
- Server-driven role assignment and win-condition checks keep gameplay fair

---

## 🛠️ Tech Stack
- **Frontend:** React 18, Tailwind CSS, Vite, React Three Fiber
- **Backend:** Node.js (v20+), Express 5, ws, Socket.IO
- **Database:** MongoDB Atlas (leaderboards & persistence)
- **Deployment:** Render (Singapore) for <60 ms latency to India

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or later
- MongoDB connection string (set `MONGO_URI` in `.env`)

### Installation
```bash
git clone https://github.com/your-org/DevHacks-CodeRed.git
cd DevHacks-CodeRed
npm install
cd backend && npm install && cd ..
```

### Build & Run
```bash
npm run build     # compiles frontend bundles
npm start         # launches master.js orchestrator
```
Open `http://localhost:3000` in your browser and navigate to `/survival`, `/darkroom`, etc.

---

## ☁️ Deployment
The project is configured for Render.com.  A single `render.yaml` file provisions all five services with internal port routing.

### To deploy manually
1. Push to a Git repo connected to Render
2. Create a web service for the hub (`hub.js`) listening on 3000
3. Add background workers for each game service using `npm start` in their folders

Environment variables: `MONGO_URI`, `PORT=3000`, any API keys.

---

## 🛠 Development
- Use `npm run dev` to start the hub and game servers locally with hot reload
- `/tools` contains helper scripts (port finder, process monitor)
- Client assets sit under `frontend/`, `game2/`, etc.  Each game is self‑contained.

Tests are minimal; add more before expanding features.

---

## 🤝 Contributing
Contributions are welcome!  Please fork the repo, make your changes on a feature branch, and open a PR.  Follow the existing code style (Prettier + ESLint).

1. Fork it
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -am 'Add foo'`)
4. Push to the branch (`git push origin feature/foo`)
5. Open a pull request

---

## 👥 Team
- Aniket Walanj
- Aryan Salunkhe
- Manav Sonawne
- Vanshita Varma

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

