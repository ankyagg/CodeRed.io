# 🔴 CodeRed.io: The Ultimate Multiplayer Game Hub

Welcome to **CodeRed.io**, a comprehensive, multi-layered gaming platform built to deliver low-latency, real-time multiplayer experiences. This project isn't just a collection of games—it is a sophisticated micro-services architecture served through a unified gateway.

---

## 🚀 The Hub Architecture (The "How It's Made")

Most web games struggle with CORS issues, port management, and fragmented domains. We solved this with a **Unified Gateway Hub**.

### 1. The Gateway (`hub.js`)
We use a central Express server acting as a **Reverse Proxy**. Using `http-proxy-middleware`, the Hub intercepts incoming requests:
- `/survival` traffic goes to the 2D Survival engine.
- `/darkroom` traffic goes to the 3D Horror engine.
- `/hoop-ws` raw WebSocket traffic is rerouted specifically to the physics engine.
This allows us to host everything on a **single port (3000)** while maintaining 4 high-performance backends behind the scenes.

### 2. The Orchestrator (`master.js`)
Managing 4 games and a hub manually is impossible. Our `master.js` script acts as a process manager. It boots all 5 servers (Survival, Darkroom, Escape, Hoop4, and Hub) simultaneously, monitors their health, and assigns them internal ports that are never exposed to the public internet, ensuring maximum security.

---

## 🎮 The Games: Deep Dive

### 1. 🌑 Dark Room Survival (3D Horror)
This is a high-fidelity 3D experience built with **React Three Fiber**.
*   **The Mechanic:** A 60-second Day/Night cycle. Players must restock supplies during the day because at night, the "Managers" (AI enemies) spawn.
*   **AI Logic:** Enemies use a distance-based tracking algorithm. If you are not **Hiding** (C key), they calculate the shortest vector to your 3D position and chase you until you enter the light or die.
*   **Technical Highlight:** Uses a custom Themed Loading Screen that blocks the main thread until the ~100MB of 3D assets are fully synchronized in the browser's GPU buffer.

### 2. 🧩 Escape Room: The Manor (Co-op Puzzle)
A narrative-driven puzzle game where room synchronization is everything.
*   **The Mechanic:** A progressive 8-stage puzzle system. Actions in one player's screen (like align-book or insert-usb) update the `GameState` on the server, which immediately triggers animations for all other players in that room.
*   **Communication:** Features an integrated **Chatbox** and **Voice Chat** signaling through WebRTC to allow players to coordinate their escape.

### 3. 🏀 Hoop-4 (Physics Multiplayer)
A competitive game that blends basketball with Connect-4 strategy.
*   **The Mechanic:** Players take turns aiming shots. We integrated **Matter.js** (a 2D physics engine) on the client to predict the ball's trajectory, but the *actual* result is validated by the server to prevent cheating.
*   **Procedural Graphics:** Instead of static images, the basketballs are procedurally rendered in 2D Canvas with 3D-shading gradients, allowing for dynamic WNBA and Wilson EVO NXT skins.

### 4. 🌲 Survival Sandbox (Open World)
A tile-based open-world survival game.
*   **The Mechanic:** A shared grid-based map where every interaction—chopping a tree, placed a wall, or dropping an item—is sent as a "Delta Update" to the server.
*   **Efficiency:** Instead of sending the whole map every time, only the "changed tiles" are broadcasted, reducing bandwidth by over 90%.

---

## 🛠️ Tech Stack & Implementation

-   **Frontend:** React 18, React Three Fiber (3D), Tailwind CSS, Vanilla JS.
-   **Backend:** Node.js, Express 5.
-   **Real-time:** Socket.IO for state-heavy games, `ws` for high-throughput physics.
-   **Database:** MongoDB Atlas (Persistent Leaderboards).
-   **Optimization:** 
    -   **Singapore Region:** Deployed to AWS Singapore via Render for sub-60ms Indian latency.
    -   **Asset Bundling:** Vite-based code splitting to ensure fast initial loads.

---

## � How to Run

1.  **Clone & Install:**
    ```bash
    npm install
    ```
2.  **Build the World:**
    ```bash
    npm run build
    ```
3.  **Start the Master Engine:**
    ```bash
    npm start
    ```

---

Live Demo : https://codered-io.onrender.com

## � The Team
Developed with passion by **Aniket Walanj, Aryan Salunkhe, Manav Sonawne & Vanshita Varma** for DevHacks.
