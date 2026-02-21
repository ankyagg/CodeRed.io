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

    const handleCreate = (e) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            createRoom(newRoomName.trim());
            setNewRoomName('');
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
                    <h2 className="card-title">[ CREATE ROOM ]</h2>
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
                            disabled={!newRoomName.trim() || !connected}
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
                                        onClick={() => joinRoom(room.id)}
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
