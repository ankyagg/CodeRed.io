import { useState, useEffect, useRef, useMemo } from 'react';
import { socket } from '../socket.js';

/**
 * useSocket — manages all server-driven multiplayer state.
 */
export function useSocket() {
    const [remotePlayers, setRemotePlayers] = useState({});
    const [foods, setFoods] = useState({});
    const [enemies, setEnemies] = useState({});
    const [dayProgress, setDayProgress] = useState(0);
    const [myHealth, setMyHealth] = useState(100);
    const [playerCount, setPlayerCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    const myIdRef = useRef(null);
    const healthRef = useRef(100);
    const progressRef = useRef(0);
    const enemiesRef = useRef({});

    useEffect(() => {
        socket.on('init', ({ playerId, players, foods: initialFoods }) => {
            myIdRef.current = playerId;
            setConnected(true);
            setFoods(initialFoods);
            setMyHealth(players[playerId]?.health ?? 100);
            setPlayerCount(Object.keys(players).length);

            const remote = {};
            for (const [id, p] of Object.entries(players)) {
                if (id !== playerId) remote[id] = p;
            }
            setRemotePlayers(remote);
        });

        socket.on('gameState', ({ players, dayProgress: dp, enemies: es }) => {
            const myId = myIdRef.current;
            const remote = {};
            for (const [id, p] of Object.entries(players)) {
                if (id === myId) {
                    if (p.health !== healthRef.current) {
                        healthRef.current = p.health;
                        setMyHealth(p.health);
                    }
                } else {
                    remote[id] = p;
                }
            }
            setRemotePlayers(remote);
            setPlayerCount(Object.keys(players).length);

            if (Math.abs(dp - progressRef.current) > 0.001) {
                progressRef.current = dp;
                setDayProgress(dp);
            }

            // Sync enemies only if count or IDs changed
            const enemyIds = Object.keys(es);
            const prevEnemyIds = Object.keys(enemiesRef.current);
            if (enemyIds.length !== prevEnemyIds.length || enemyIds.some(id => !enemiesRef.current[id])) {
                enemiesRef.current = es;
                setEnemies(es);
            }
        });

        socket.on('playerJoined', (player) => {
            setRemotePlayers(prev => ({ ...prev, [player.id]: player }));
        });

        socket.on('playerLeft', (id) => {
            setRemotePlayers(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        });

        socket.on('playerTorchUpdate', ({ playerId, torchOn }) => {
            setRemotePlayers(prev => {
                if (!prev[playerId]) return prev;
                return { ...prev, [playerId]: { ...prev[playerId], torchOn } };
            });
        });

        socket.on('foodConsumed', ({ foodId, playerId, newHealth }) => {
            setFoods(prev => {
                const next = { ...prev };
                delete next[foodId];
                return next;
            });
            if (playerId === myIdRef.current) {
                setMyHealth(newHealth);
            }
        });

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('receive_chat', (data) => {
            setMessages(prev => [...prev, data]);
        });

        return () => {
            socket.off('init');
            socket.off('gameState');
            socket.off('playerJoined');
            socket.off('playerLeft');
            socket.off('playerTorchUpdate');
            socket.off('foodConsumed');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('receive_chat');
        };
    }, []);

    return useMemo(() => ({
        socket,
        remotePlayers,
        foods,
        enemies,
        dayProgress,
        myHealth,
        playerCount,
        connected,
        messages,
        sendChat: (message) => socket.emit('send_chat', { message })
    }), [remotePlayers, foods, enemies, dayProgress, myHealth, playerCount, connected, messages]);
}
