import React, { useState, useEffect, useCallback } from 'react';
import { Game } from './components/Game.jsx';
import { HUD } from './components/HUD.jsx';
import { Lobby } from './components/Lobby.jsx';
import { Chat } from './components/Chat.jsx';
import { VoiceChat } from './components/VoiceChat.jsx';
import { useSocket } from './hooks/useSocket.js';
import { useVoiceChat } from './hooks/useVoiceChat.js';

export default function App() {
    const [roomId, setRoomId] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const { socket, remotePlayers, foods, enemies, dayProgress, myHealth, playerCount, connected, messages, sendChat } = useSocket();
    const { isVoiceActive, isMuted, peerCount, error: voiceError, joinVoice, leaveVoice, toggleMute } = useVoiceChat();
    const [torchBattery, setTorchBattery] = useState(100);
    const [isHiding, setIsHiding] = useState(false);
    const [inventory, setInventory] = useState([]);

    // Join room on socket when roomId is set
    useEffect(() => {
        if (socket && roomId) {
            socket.emit('joinRoom', { roomId, playerName });
        }
    }, [socket, roomId]);

    // Listen for useItem event to heal
    useEffect(() => {
        if (!socket) return;
        socket.on('itemUsed', ({ newHealth }) => {
            // Health update handled by gameState
        });
        return () => socket.off('itemUsed');
    }, [socket]);

    const handleUseItem = useCallback((slotIndex) => {
        if (slotIndex >= inventory.length) return;
        const item = inventory[slotIndex];
        if (item && socket) {
            socket.emit('useItem', { healthRestore: item.healthRestore || 10 });
            setInventory(prev => prev.filter((_, i) => i !== slotIndex));
        }
    }, [inventory, socket]);

    if (!roomId) {
        return <Lobby onJoin={(id, name) => { setRoomId(id); setPlayerName(name); }} connected={connected} />;
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            <Game
                socket={socket}
                remotePlayers={remotePlayers}
                foods={foods}
                enemies={enemies}
                dayProgress={dayProgress}
                onBatteryChange={setTorchBattery}
                onHidingChange={setIsHiding}
                inventory={inventory}
                setInventory={setInventory}
            />

            <HUD
                health={myHealth}
                battery={torchBattery}
                playerCount={playerCount}
                connected={connected}
                roomId={roomId}
                dayProgress={dayProgress}
                isHiding={isHiding}
                inventory={inventory}
                onUseItem={handleUseItem}
            />

            <Chat messages={messages} sendChat={sendChat} />

            <VoiceChat
                isVoiceActive={isVoiceActive}
                isMuted={isMuted}
                peerCount={peerCount}
                error={voiceError}
                onJoin={joinVoice}
                onLeave={leaveVoice}
                onToggleMute={toggleMute}
            />
        </div>
    );
}
