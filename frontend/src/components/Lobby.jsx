import { useState } from 'react';

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

export default function Lobby({ connected, roomList, createRoom, joinRoom, refreshRooms }) {
    const [newRoomName, setNewRoomName] = useState('');
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('survival_nickname') || '');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newRoomName.trim() && playerName.trim()) {
            localStorage.setItem('survival_nickname', playerName.trim());
            createRoom(newRoomName.trim(), playerName.trim());
            setNewRoomName('');
        } else if (!playerName.trim()) {
            alert('Please enter a nickname to play!');
        }
    };

    const handleJoin = (roomId) => {
        if (playerName.trim()) {
            localStorage.setItem('survival_nickname', playerName.trim());
            joinRoom(roomId, playerName.trim());
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
                    <p className="lobby-subtitle">
                        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
                        {connected ? 'SERVER ONLINE' : 'CONNECTING...'}
                    </p>
                </div>

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
                            className="room-input mb-4"
                            maxLength={16}
                            autoFocus
                        />
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
                <div className="lobby-controls">
                    <span><b>WASD</b> Move</span>
                    <span><b>E</b> Break</span>
                    <span><b>SPC</b> Attack</span>
                </div>
            </div>
        </div>
    );
}
