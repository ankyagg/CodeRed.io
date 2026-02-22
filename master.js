const { spawn } = require('child_process');
const path = require('path');

/**
 * Master Startup Script for Cloud Hosting (Railway, etc.)
 * This launches all 4 game backends and the unified Master Hub.
 */

const servers = [
    { name: 'SURVIVAL', path: './backend/server.js' },
    { name: 'DARKROOM', path: './game3/server.js' },
    { name: 'ESCAPE', path: './game2/server/server.js' },
    { name: 'HOOP4', path: './game4/server.js' },
    { name: 'HUB', path: './hub.js' }
];

console.log('🌟 [CODERED MASTER] Booting up all game sectors...\n');

servers.forEach(srv => {
    const proc = spawn('node', [srv.path], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: getPortFor(srv.name) }
    });

    proc.on('error', (err) => {
        console.error(`❌ [${srv.name}] Failed to start:`, err.message);
    });

    console.log(`✅ [MASTER] Started ${srv.name} module`);
});

function getPortFor(name) {
    switch (name) {
        case 'SURVIVAL': return 3001;
        case 'DARKROOM': return 3002;
        case 'ESCAPE': return 3003;
        case 'HOOP4': return 3004;
        case 'HUB': return 3000;
        default: return 0;
    }
}

console.log('\n🚀 ALL SYSTEMS NOMINAL. Master Hub on port 3000.');
