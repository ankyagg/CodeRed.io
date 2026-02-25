import React, { useState, useEffect, useRef } from 'react';

/**
 * Lobby — Backrooms-themed entry screen.
 * Features: username, create room, join room, MongoDB leaderboard.
 */
export function Lobby({ onJoin, connected }) {
    const [playerName, setPlayerName] = useState(
        () => localStorage.getItem('darkroom_nickname') || ''
    );
    const [roomCode, setRoomCode] = useState('');
    const [roomName, setRoomName] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLb, setLoadingLb] = useState(true);
    const flickerRef = useRef(null);

    // Fetch leaderboard on mount
    useEffect(() => {
        const fetchLb = async () => {
            try {
                const leaderboardUrl = import.meta.env.VITE_API_URL
                    ? `${import.meta.env.VITE_API_URL}/api/leaderboard`
                    : '/darkroom/api/leaderboard';
                const res = await fetch(leaderboardUrl);
                if (res.ok) setLeaderboard(await res.json());
            } catch (e) {
                console.error('Leaderboard fetch failed', e);
            } finally {
                setLoadingLb(false);
            }
        };
        fetchLb();
    }, []);

    // Fluorescent flicker animation
    useEffect(() => {
        const el = flickerRef.current;
        if (!el) return;
        let t;
        const flicker = () => {
            const rand = Math.random();
            if (rand < 0.04) {
                el.style.opacity = '0.3';
                setTimeout(() => { el.style.opacity = '1'; }, 60 + Math.random() * 80);
            }
            t = setTimeout(flicker, 800 + Math.random() * 2000);
        };
        t = setTimeout(flicker, 1500);
        return () => clearTimeout(t);
    }, []);

    const saveName = (name) => {
        setPlayerName(name);
        if (name.trim()) localStorage.setItem('darkroom_nickname', name.trim());
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!playerName.trim()) return alert('Enter a nickname first!');
        if (!roomName.trim()) return alert('Enter a room name!');
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        onJoin(id, playerName.trim());
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!playerName.trim()) return alert('Enter a nickname first!');
        if (!roomCode.trim()) return alert('Enter a room code!');
        onJoin(roomCode.trim().toUpperCase(), playerName.trim());
    };

    return (
        <div style={s.root}>
            {/* ─── Backrooms Background ─── */}
            <div style={s.bg}>
                {/* Perspective hallway using CSS */}
                <div style={s.hallway}>
                    {/* Floor */}
                    <div style={s.floor} />
                    {/* Ceiling */}
                    <div style={s.ceiling} />
                    {/* Left wall */}
                    <div style={s.wallLeft} />
                    {/* Right wall */}
                    <div style={s.wallRight} />
                    {/* Back wall */}
                    <div style={s.wallBack} />
                    {/* Hallway panels receding into distance */}
                    {[0.9, 0.75, 0.6, 0.48, 0.38, 0.3].map((scale, i) => (
                        <div key={i} style={{ ...s.hallPanel, transform: `translate(-50%, -50%) scale(${scale})`, opacity: 0.15 + i * 0.12 }} />
                    ))}
                    {/* Fluorescent lights */}
                    {[0.95, 0.78, 0.63, 0.5, 0.4].map((pos, i) => (
                        <div
                            key={i}
                            style={{
                                ...s.light,
                                top: `${(1 - pos) * 48 + 2}%`,
                                width: `${pos * 28}%`,
                                opacity: 0.5 + i * 0.08,
                                boxShadow: `0 0 ${20 + i * 10}px ${8 + i * 4}px rgba(220, 230, 180, 0.35)`,
                            }}
                        />
                    ))}
                    {/* Flicker overlay */}
                    <div ref={flickerRef} style={s.flickerOverlay} />
                    {/* Yellow-green tint */}
                    <div style={s.tint} />
                </div>
            </div>

            {/* ─── Scanline overlay ─── */}
            <div style={s.scanlines} />

            {/* ─── UI Card ─── */}
            <div style={s.uiWrapper}>
                {/* Title */}
                <div style={s.titleBlock}>
                    <p style={s.warningText}>⚠ LEVEL 0 — THE BACKROOMS ⚠</p>
                    <h1 style={s.title}>DARK ROOM</h1>
                    <div style={s.statusRow}>
                        <span style={{ ...s.dot, background: connected ? '#6eff6e' : '#ff6e6e', boxShadow: connected ? '0 0 8px #6eff6e' : '0 0 8px #ff6e6e' }} />
                        <span style={s.statusText}>{connected ? 'SERVER ONLINE' : 'CONNECTING...'}</span>
                    </div>
                </div>

                {/* Two-panel layout */}
                <div style={s.panels}>

                    {/* LEFT: Controls */}
                    <div style={s.leftPanel}>
                        {/* Nickname */}
                        <div style={s.card}>
                            <h2 style={s.cardTitle}>▸ IDENTITY</h2>
                            <label style={s.label}>NICKNAME</label>
                            <input
                                style={s.input}
                                value={playerName}
                                onChange={e => saveName(e.target.value)}
                                placeholder="Enter your name..."
                                maxLength={16}
                                autoFocus
                            />
                        </div>

                        {/* Create Room */}
                        <div style={s.card}>
                            <h2 style={s.cardTitle}>▸ CREATE ROOM</h2>
                            <form onSubmit={handleCreate} style={s.form}>
                                <label style={s.label}>ROOM NAME</label>
                                <input
                                    style={s.input}
                                    value={roomName}
                                    onChange={e => setRoomName(e.target.value)}
                                    placeholder="e.g. Level 37..."
                                    maxLength={30}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        ...s.btnPrimary,
                                        ...(!playerName.trim() || !roomName.trim() || !connected ? s.btnDisabled : {})
                                    }}
                                    disabled={!playerName.trim() || !roomName.trim() || !connected}
                                >
                                    CREATE ROOM
                                </button>
                            </form>
                        </div>

                        {/* Join Room */}
                        <div style={s.card}>
                            <h2 style={s.cardTitle}>▸ JOIN ROOM</h2>
                            <form onSubmit={handleJoin} style={s.form}>
                                <label style={s.label}>ROOM CODE</label>
                                <input
                                    style={{ ...s.input, textTransform: 'uppercase', letterSpacing: 6, textAlign: 'center' }}
                                    value={roomCode}
                                    onChange={e => setRoomCode(e.target.value)}
                                    placeholder="XXXXXX"
                                    maxLength={8}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        ...s.btnSecondary,
                                        ...(!playerName.trim() || !roomCode.trim() || !connected ? s.btnDisabled : {})
                                    }}
                                    disabled={!playerName.trim() || !roomCode.trim() || !connected}
                                >
                                    JOIN ROOM
                                </button>
                            </form>
                        </div>

                        {/* Controls hint */}
                        <div style={s.controls}>
                            <span><b>WASD</b> Move</span>
                            <span><b>MOUSE</b> Look</span>
                            <span><b>F</b> Torch</span>
                            <span><b>C</b> Crouch</span>
                            <span><b>E</b> Pick up</span>
                        </div>
                    </div>

                    {/* RIGHT: Leaderboard */}
                    <div style={s.rightPanel}>
                        <div style={{ ...s.card, flex: 1 }}>
                            <h2 style={{ ...s.cardTitle, color: '#e8d44d', textShadow: '0 0 10px rgba(232,212,77,0.5)' }}>
                                🏆 HALL OF SURVIVORS
                            </h2>
                            <div style={s.lbHeader}>
                                <span style={{ width: 36 }}>RANK</span>
                                <span style={{ flex: 1 }}>PLAYER</span>
                                <span style={{ width: 76, textAlign: 'right' }}>🌙 NIGHTS</span>
                                <span style={{ width: 76, textAlign: 'right' }}>🍎 FOOD</span>
                            </div>
                            <div style={s.lbList}>
                                {loadingLb ? (
                                    <p style={s.lbEmpty}>Loading...</p>
                                ) : leaderboard.length === 0 ? (
                                    <p style={s.lbEmpty}>No survivors yet...</p>
                                ) : (
                                    leaderboard.map((p, i) => {
                                        let rankColor = '#888';
                                        let rowBg = 'transparent';
                                        let rankGlow = 'none';
                                        if (i === 0) { rankColor = '#ffd700'; rowBg = 'rgba(255,215,0,0.07)'; rankGlow = '0 0 8px #ffd700'; }
                                        if (i === 1) { rankColor = '#c0c0c0'; rowBg = 'rgba(192,192,192,0.06)'; rankGlow = '0 0 6px #c0c0c0'; }
                                        if (i === 2) { rankColor = '#cd7f32'; rowBg = 'rgba(205,127,50,0.06)'; rankGlow = '0 0 6px #cd7f32'; }
                                        return (
                                            <div key={i} style={{ ...s.lbRow, background: rowBg }}>
                                                <span style={{ width: 36, color: rankColor, fontWeight: 900, textShadow: rankGlow }}>#{i + 1}</span>
                                                <span style={{ flex: 1, color: '#d4dda0', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
                                                <span style={{ width: 76, textAlign: 'right', color: '#a0c0ff', fontFamily: 'monospace', fontWeight: 700 }}>{p.nightsSurvived || 0}</span>
                                                <span style={{ width: 76, textAlign: 'right', color: '#ff9966', fontFamily: 'monospace', fontWeight: 700 }}>{p.foodEaten || 0}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Styles ─── */
const YELLOW = '#c8c96a';
const CARD_BG = 'rgba(10, 11, 6, 0.82)';
const BORDER = '1px solid rgba(180, 185, 100, 0.2)';

const s = {
    root: {
        position: 'fixed', inset: 0,
        fontFamily: '"Courier New", "Consolas", monospace',
        overflow: 'hidden',
        color: YELLOW,
    },

    /* Background */
    bg: {
        position: 'absolute', inset: 0,
        background: '#1a1c0e',
    },
    hallway: {
        position: 'absolute', inset: 0,
        perspective: '600px',
        perspectiveOrigin: '50% 50%',
        overflow: 'hidden',
    },
    floor: {
        position: 'absolute',
        left: '-10%', right: '-10%',
        bottom: '-5%', top: '52%',
        background: `
            repeating-linear-gradient(90deg, rgba(100,95,60,0.4) 0px, rgba(100,95,60,0.4) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(0deg, rgba(100,95,60,0.4) 0px, rgba(100,95,60,0.4) 1px, transparent 1px, transparent 40px),
            linear-gradient(to bottom, #3a3520 0%, #2a2615 100%)
        `,
        transform: 'rotateX(65deg)',
        transformOrigin: '50% 0%',
    },
    ceiling: {
        position: 'absolute',
        left: '-10%', right: '-10%',
        top: '-5%', bottom: '52%',
        background: `
            repeating-linear-gradient(90deg, rgba(160,165,100,0.1) 0px, rgba(160,165,100,0.1) 1px, transparent 1px, transparent 80px),
            repeating-linear-gradient(0deg, rgba(160,165,100,0.1) 0px, rgba(160,165,100,0.1) 1px, transparent 1px, transparent 80px),
            linear-gradient(to top, #28291a 0%, #1e1f12 100%)
        `,
        transform: 'rotateX(-65deg)',
        transformOrigin: '50% 100%',
    },
    wallLeft: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        width: '32%',
        background: `
            repeating-linear-gradient(
                180deg,
                transparent 0px, transparent 22px,
                rgba(120,125,70,0.12) 22px, rgba(120,125,70,0.12) 24px
            ),
            linear-gradient(to right, #1c1e10 0%, #252812 50%, #1a1c0e 100%)
        `,
        transform: 'skewY(-12deg)',
        transformOrigin: '100% 50%',
    },
    wallRight: {
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: '32%',
        background: `
            repeating-linear-gradient(
                180deg,
                transparent 0px, transparent 22px,
                rgba(120,125,70,0.12) 22px, rgba(120,125,70,0.12) 24px
            ),
            linear-gradient(to left, #1c1e10 0%, #252812 50%, #1a1c0e 100%)
        `,
        transform: 'skewY(12deg)',
        transformOrigin: '0% 50%',
    },
    wallBack: {
        position: 'absolute',
        top: '22%', bottom: '22%',
        left: '30%', right: '30%',
        background: `
            repeating-linear-gradient(
                180deg,
                transparent 0px, transparent 18px,
                rgba(140,145,80,0.15) 18px, rgba(140,145,80,0.15) 20px
            ),
            linear-gradient(135deg, #23250f 0%, #1a1c09 100%)
        `,
    },
    hallPanel: {
        position: 'absolute',
        top: '50%', left: '50%',
        width: '42%', height: '56%',
        border: '1px solid rgba(180,190,100,0.15)',
    },
    light: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        height: 4,
        background: 'rgba(230, 235, 180, 0.9)',
        borderRadius: 2,
    },
    flickerOverlay: {
        position: 'absolute', inset: 0,
        background: 'transparent',
        transition: 'opacity 0.05s',
    },
    tint: {
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(180, 195, 80, 0.08) 0%, rgba(10, 12, 5, 0.55) 100%)',
    },

    /* Scanlines */
    scanlines: {
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        pointerEvents: 'none',
        zIndex: 5,
    },

    /* UI layout */
    uiWrapper: {
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: 16,
        overflowY: 'auto',
    },

    titleBlock: {
        textAlign: 'center',
        marginBottom: 4,
    },
    warningText: {
        color: '#ff9922',
        fontSize: 11,
        letterSpacing: 4,
        margin: '0 0 4px',
        textShadow: '0 0 8px rgba(255,160,0,0.6)',
        animation: 'pulse 2.5s ease-in-out infinite',
    },
    title: {
        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
        fontWeight: 900,
        letterSpacing: 14,
        color: '#d4d870',
        margin: '4px 0',
        textShadow: '0 0 30px rgba(200,210,80,0.4), 0 0 60px rgba(200,210,80,0.2)',
    },
    statusRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 6,
    },
    dot: {
        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
    },
    statusText: {
        fontSize: 10, letterSpacing: 3, color: '#a0a860',
    },

    panels: {
        display: 'flex',
        gap: 16,
        width: '100%',
        maxWidth: 900,
        alignItems: 'flex-start',
    },
    leftPanel: {
        display: 'flex', flexDirection: 'column', gap: 12,
        flex: '0 0 340px',
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
    },

    card: {
        background: CARD_BG,
        border: BORDER,
        borderRadius: 8,
        padding: '16px 20px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,210,80,0.06)',
    },
    cardTitle: {
        margin: '0 0 12px',
        fontSize: 11,
        letterSpacing: 3,
        color: YELLOW,
        fontWeight: 700,
    },
    label: {
        display: 'block',
        fontSize: 9,
        letterSpacing: 3,
        color: '#778040',
        marginBottom: 6,
        fontWeight: 700,
    },
    input: {
        display: 'block',
        width: '100%',
        padding: '10px 14px',
        border: '1px solid rgba(180,185,80,0.25)',
        borderRadius: 4,
        background: 'rgba(20,22,8,0.8)',
        color: '#d4d870',
        fontSize: 13,
        fontFamily: '"Courier New", monospace',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    form: {
        display: 'flex', flexDirection: 'column', gap: 10,
    },
    btnPrimary: {
        padding: '12px 16px',
        border: '1px solid rgba(180,185,80,0.5)',
        borderRadius: 4,
        background: 'linear-gradient(135deg, rgba(160,170,40,0.3) 0%, rgba(100,110,20,0.4) 100%)',
        color: '#d4d870',
        fontSize: 12,
        fontFamily: '"Courier New", monospace',
        letterSpacing: 3,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 0 12px rgba(160,170,40,0.15)',
    },
    btnSecondary: {
        padding: '12px 16px',
        border: '1px solid rgba(180,185,80,0.25)',
        borderRadius: 4,
        background: 'rgba(20,22,8,0.6)',
        color: '#a0a860',
        fontSize: 12,
        fontFamily: '"Courier New", monospace',
        letterSpacing: 3,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    btnDisabled: {
        opacity: 0.35,
        cursor: 'not-allowed',
    },
    controls: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 16px',
        fontSize: 10,
        color: '#606840',
        letterSpacing: 1,
        padding: '8px 12px',
        borderTop: '1px solid rgba(180,185,80,0.1)',
    },

    /* Leaderboard */
    lbHeader: {
        display: 'flex',
        gap: 8,
        padding: '0 4px 8px',
        borderBottom: '1px solid rgba(180,185,80,0.15)',
        fontSize: 9,
        letterSpacing: 2,
        color: '#606840',
        fontWeight: 700,
        marginBottom: 6,
    },
    lbList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflowY: 'auto',
        maxHeight: 340,
    },
    lbRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 4px',
        borderRadius: 4,
        fontSize: 12,
        transition: 'background 0.2s',
    },
    lbEmpty: {
        textAlign: 'center',
        color: '#606840',
        fontSize: 12,
        padding: '40px 0',
        fontStyle: 'italic',
    },
};
