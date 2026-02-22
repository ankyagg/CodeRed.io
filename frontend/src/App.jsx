import { useState, useEffect } from 'react';
import useSocket from './hooks/useSocket';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Lobby from './components/Lobby';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';

export default function App() {
    const {
        connected, myId, world, players, mobs, emit, ping, leaderboard, matchWinner,
        messages, sendChat,
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
                isOpen={isLeaderboardOpen && !matchWinner}
            />
            <Chat messages={messages} sendChat={sendChat} />

            {matchWinner && (
                <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <h1 className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] mb-4 animate-bounce uppercase">
                        MATCH OVER!
                    </h1>
                    <div className="bg-gray-900 border-4 border-yellow-500 p-8 rounded text-center">
                        <p className="text-gray-300 font-mono mb-2 text-xl tracking-widest">WINNER:</p>
                        <p className="text-white font-bold text-4xl mb-4">{matchWinner.winnerName}</p>
                        <p className="text-emerald-400 font-mono text-2xl">Score: {Math.max(0, matchWinner.score - 1000)}</p>
                    </div>
                    <p className="text-gray-500 font-mono mt-8 animate-pulse text-xs tracking-widest">Returning to lobby in 5 seconds...</p>
                </div>
            )}
        </div>
    );
}
