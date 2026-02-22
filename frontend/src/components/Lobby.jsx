import { useState, useEffect } from 'react';
import { AVATARS, PALETTE } from '../game/renderer';

function AvatarPreview({ avatarName, isSelected, onClick }) {
    const grid = AVATARS[avatarName];
    if (!grid) return null;

    return (
        <div
            onClick={onClick}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                border: isSelected ? '2px solid #fbbf24' : '2px solid transparent',
                borderRadius: '6px',
                padding: '2px',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.2s',
            }}
            title={avatarName}
            className="hover:bg-white/10 hover:scale-110"
        >
            {grid.flatMap((row, rIdx) =>
                row.split('').map((char, cIdx) => (
                    <div
                        key={`${rIdx}-${cIdx}`}
                        style={{ backgroundColor: PALETTE[char] || 'transparent' }}
                    />
                ))
            )}
        </div>
    );
}

// Ground block strip — rows of grass/dirt blocks across the bottom
function GroundStrip() {
    return (
        <div className="ground-strip">
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="ground-block" />
            ))}
        </div>
    );
}

export default function Lobby({ connected, roomList, createRoom, joinRoom, refreshRooms, socketError }) {
    const [newRoomName, setNewRoomName] = useState('');
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('survival_nickname') || '');
    const [playerAvatar, setPlayerAvatar] = useState(() => localStorage.getItem('survival_avatar') || 'steve');
    const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const leaderboardUrl = `/api/leaderboard`;

                const isNgrok = window.location.hostname.includes('ngrok');
                const headers = isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {};

                const res = await fetch(leaderboardUrl, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setGlobalLeaderboard(data);
                }
            } catch (err) {
                console.error("Failed to fetch global leaderboard", err);
            } finally {
                setLoadingLeaderboard(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        if (newRoomName.trim() && playerName.trim()) {
            localStorage.setItem('survival_nickname', playerName.trim());
            localStorage.setItem('survival_avatar', playerAvatar);
            createRoom(newRoomName.trim(), playerName.trim(), playerAvatar);
            setNewRoomName('');
        } else if (!playerName.trim()) {
            alert('Please enter a nickname to play!');
        }
    };

    const handleJoin = (roomId) => {
        if (playerName.trim()) {
            localStorage.setItem('survival_nickname', playerName.trim());
            localStorage.setItem('survival_avatar', playerAvatar);
            joinRoom(roomId, playerName.trim(), playerAvatar);
        } else {
            alert('Please enter a nickname to play!');
        }
    };

    return (
        <div className="lobby-container">
            {/* Floating square particles */}
            <div className="lobby-particles">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${(i * 5.7 + 3) % 100}%`,
                            animationDelay: `${(i * 0.4) % 7}s`,
                            animationDuration: `${6 + (i % 5)}s`,
                        }}
                    />
                ))}
            </div>

            {/* Ground */}
            <GroundStrip />

            <div className="lobby-content">
                {/* Logo & Title */}
                <div className="lobby-header">
                    <span className="lobby-logo">⛏️</span>
                    <h1 className="lobby-title">SURVIVAL SANDBOX</h1>
                    <div className="lobby-subtitle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div>
                            <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
                            {connected ? 'SERVER ONLINE' : 'CONNECTING...'}
                        </div>
                        {socketError && (
                            <div className="text-[7px] text-red-500 font-bold bg-black/40 px-2 py-1 border border-red-500/20">
                                ⚠️ {socketError}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lobby-panels">
                    <div className="lobby-left-panel">
                        {/* Create Room Card */}
                        <div className="lobby-card">
                            <h2 className="card-title">[ JOIN OR CREATE ]</h2>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 mb-1 tracking-widest">NICKNAME</label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="room-input w-full"
                                    maxLength={16}
                                    autoFocus
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 mb-2 tracking-widest">CHOOSE AVATAR</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                                    {Object.keys(AVATARS).map(a => (
                                        <AvatarPreview
                                            key={a}
                                            avatarName={a}
                                            isSelected={playerAvatar === a}
                                            onClick={() => setPlayerAvatar(a)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <h3 className="block text-xs font-bold text-gray-400 mb-1 tracking-widest">NEW WORLD</h3>
                            <form onSubmit={handleCreate} className="create-form">
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="room name..."
                                    className="room-input"
                                    maxLength={30}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="btn-create"
                                    disabled={!newRoomName.trim() || !playerName.trim() || !connected}
                                >
                                    CREATE
                                </button>
                            </form>
                        </div>

                        {/* Room List Card */}
                        <div className="lobby-card">
                            <div className="card-header">
                                <h2 className="card-title">[ JOIN WORLD ]</h2>
                                <button onClick={refreshRooms} className="btn-refresh" title="Refresh">
                                    ↻
                                </button>
                            </div>

                            {roomList.length === 0 ? (
                                <div className="empty-rooms">
                                    <p className="empty-icon">🌑</p>
                                    <p className="empty-text">NO WORLDS FOUND</p>
                                    <p className="empty-text" style={{ marginTop: 6, opacity: 0.6 }}>create one above!</p>
                                </div>
                            ) : (
                                <div className="room-list">
                                    {roomList.map((room) => (
                                        <div key={room.id} className="room-item">
                                            <div className="room-info">
                                                <span className="room-name">🌍 {room.name}</span>
                                                <span className="room-players">
                                                    👥 {room.playerCount} player{room.playerCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleJoin(room.id)}
                                                className="btn-join"
                                                disabled={!connected}
                                            >
                                                JOIN
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Controls Help */}
                        <div className="lobby-controls" style={{ marginTop: '10px' }}>
                            <span><b>WASD</b> Move</span>
                            <span><b>E</b> Break</span>
                            <span><b>SPC</b> Attack</span>
                        </div>
                    </div>

                    <div className="lobby-right-panel">
                        {/* Global Leaderboard Card */}
                        <div className="lobby-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h2 className="card-title text-center text-yellow-500 mb-4 text-xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                                🏆 GLOBAL HALL OF FAME
                            </h2>

                            <div className="flex text-[10px] font-bold text-gray-400 pb-2 border-b border-white/10 mb-3 px-2 tracking-widest uppercase gap-2">
                                <div className="w-12 text-center text-gray-500">RANK</div>
                                <div className="flex-1">PLAYER</div>
                                <div className="w-20 text-right">SCORE</div>
                                <div className="w-16 text-right">K/D</div>
                                <div className="w-28 text-right">TIME</div>
                            </div>

                            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar" style={{ flex: 1, minHeight: '300px' }}>
                                {loadingLeaderboard ? (
                                    <div className="text-center py-8 text-gray-500 text-xs font-mono animate-pulse">Loading stats...</div>
                                ) : globalLeaderboard.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-xs italic">No entries yet...</div>
                                ) : (
                                    globalLeaderboard.map((player, idx) => {
                                        let rankColor = "text-gray-500 font-mono";
                                        let rowBg = "hover:bg-white/5 border border-transparent";

                                        if (idx === 0) {
                                            rankColor = "text-yellow-400 font-black text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
                                            rowBg = "bg-yellow-500/10 border border-yellow-500/20";
                                        } else if (idx === 1) {
                                            rankColor = "text-gray-300 font-black text-lg drop-shadow-[0_0_5px_rgba(209,213,219,0.5)]";
                                            rowBg = "bg-gray-400/10 border border-gray-400/20";
                                        } else if (idx === 2) {
                                            rankColor = "text-amber-600 font-black text-lg drop-shadow-[0_0_5px_rgba(217,119,6,0.5)]";
                                            rowBg = "bg-amber-600/10 border border-amber-600/20";
                                        }

                                        return (
                                            <div key={idx} className={`flex items-center text-sm p-3 rounded-xl transition-colors gap-2 ${rowBg}`}>
                                                <div className={`w-12 text-center ${rankColor}`}>
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 truncate font-bold text-gray-200 text-xs" title={player.nickname}>
                                                    {player.nickname}
                                                </div>
                                                <div className="w-20 text-right font-mono text-emerald-400 font-bold">
                                                    {player.totalScore?.toLocaleString() || 0}
                                                </div>
                                                <div className="w-16 text-right font-mono text-gray-400 text-xs">
                                                    <span className="text-orange-400">{player.totalKills || 0}</span>/
                                                    <span className="text-red-400">{player.totalDeaths || 0}</span>
                                                </div>
                                                <div className="w-28 text-right font-mono text-gray-400 text-xs">
                                                    {Math.floor((player.bestSurvivalTimeSeconds || 0) / 60)}m {(player.bestSurvivalTimeSeconds || 0) % 60}s
                                                </div>
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
