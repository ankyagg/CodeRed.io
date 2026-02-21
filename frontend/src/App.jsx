import { useState, useEffect } from 'react';
import useSocket from './hooks/useSocket';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Lobby from './components/Lobby';
import Leaderboard from './components/Leaderboard';

export default function App() {
    const {
        connected, myId, world, players, mobs, emit, ping, leaderboard,
        inGame, roomId, roomName, roomList,
        createRoom, joinRoom, leaveRoom, refreshRooms,
    } = useSocket();

    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setIsLeaderboardOpen(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setIsLeaderboardOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Show lobby when not in a game room
    if (!inGame) {
        return (
            <Lobby
                connected={connected}
                roomList={roomList}
                createRoom={createRoom}
                joinRoom={joinRoom}
                refreshRooms={refreshRooms}
            />
        );
    }

    // In-game view
    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <GameCanvas
                world={world}
                players={players}
                mobs={mobs}
                myId={myId}
                emit={emit}
            />
            <HUD
                players={players}
                myId={myId}
                connected={connected}
                roomName={roomName}
                onLeave={leaveRoom}
                ping={ping}
            />
            <Leaderboard
                leaderboard={leaderboard}
                myId={myId}
                isOpen={isLeaderboardOpen}
            />
        </div>
    );
}
