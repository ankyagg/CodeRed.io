const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// --- PRODUCTION ASSET SERVING ---
// If dist folders exist, serve them directly. Otherwise, proxy to dev servers.
const serveOrProxy = (context, distPath, devTarget) => {
    const fullDistPath = path.resolve(__dirname, distPath);

    if (fs.existsSync(fullDistPath)) {
        console.log(`📦 Serving ${context} from built files: ${distPath}`);
        app.use(context, express.static(fullDistPath));
        // SPA Fallback for each game
        app.get(`${context}/*`, (req, res, next) => {
            if (req.path.includes('.')) return next(); // Let static files through
            res.sendFile(path.join(fullDistPath, 'index.html'));
        });
    } else {
        console.log(`🔗 Proxying ${context} to dev server: ${devTarget}`);
        app.use(createProxyMiddleware({
            pathFilter: context,
            target: devTarget,
            changeOrigin: true
        }));
    }
};

// 1. Survival Sandbox
app.use(createProxyMiddleware({
    pathFilter: '/survival/socket.io',
    target: 'http://localhost:3001',
    ws: true,
    changeOrigin: true
}));
serveOrProxy('/survival', './frontend/dist', 'http://localhost:5173');

// 2. Escape Room
app.use(createProxyMiddleware({
    pathFilter: '/escape/socket.io',
    target: 'http://localhost:3003',
    ws: true,
    changeOrigin: true
}));
serveOrProxy('/escape', './game2/client/dist', 'http://localhost:5174');

// 3. Dark Room Survival
app.use(createProxyMiddleware({
    pathFilter: '/darkroom/socket.io',
    target: 'http://localhost:3002',
    ws: true,
    changeOrigin: true
}));
serveOrProxy('/darkroom', './game3/dist', 'http://localhost:5175');

// 4. HOOP-4
app.use(createProxyMiddleware({
    pathFilter: '/hoop-ws',
    target: 'http://localhost:3004',
    ws: true,
    changeOrigin: true,
    pathRewrite: { '^/hoop-ws': '' }
}));
serveOrProxy('/hoop', './game4/dist', 'http://localhost:5176');


// --- LANDING PAGE ---
app.use(express.static(path.join(__dirname, 'landing')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 CODERED HUB IS LIVE!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`\nMode: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'HYBRID'}`);
});
