import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Smart connection routing:
// - If built (production mode), use the exact origin (this handles Ngrok perfectly)
// - If in dev mode, try environment variables, or fallback to LAN IP
const SERVER_URL = import.meta.env.PROD
    ? window.location.origin
    : (import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`);

export default function useSocket() {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [myId, setMyId] = useState(null);
    const [world, setWorld] = useState([]);
    const [players, setPlayers] = useState({});
    const [mobs, setMobs] = useState({});

    // Room state
    const [inGame, setInGame] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [roomList, setRoomList] = useState([]);

    // New features state
    const [leaderboard, setLeaderboard] = useState([]);
    const [ping, setPing] = useState(0);
    const [matchWinner, setMatchWinner] = useState(null);

    // Track ping start time
    const pingStartRef = useRef(0);

    useEffect(() => {
        const socket = io(SERVER_URL, {
            path: '/survival/socket.io',
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);

            // Auto-reconnect if we were in a game
            const savedRoomId = roomId; // From React state wrapper
            const savedPlayerName = localStorage.getItem('survival_nickname');
            if (savedRoomId && savedPlayerName) {
                socket.emit('joinRoom', { roomId: savedRoomId, playerName: savedPlayerName });
            }
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        // ── Ping/Pong ──
        const pingInterval = setInterval(() => {
            if (socket.connected) {
                pingStartRef.current = Date.now();
                socket.emit('ping');
            }
        }, 3000);

        socket.on('pong', () => {
            setPing(Date.now() - pingStartRef.current);
        });

        // ── Room Events ──
        socket.on('roomList', (list) => {
            setRoomList(list);
        });

        socket.on('roomCreated', ({ roomId, roomName }) => {
            setRoomId(roomId);
            setRoomName(roomName);
        });

        socket.on('leftRoom', () => {
            setInGame(false);
            setRoomId(null);
            setRoomName('');
            setWorld([]);
            setPlayers({});
            setMobs({});
            setLeaderboard([]);
            setMatchWinner(null);
        });

        // ── Game Events ──
        socket.on('init', (data) => {
            setMyId(data.yourId);
            setWorld(data.world);
            setPlayers(data.players);
            setMobs(data.mobs);
            setRoomId(data.roomId);
            setRoomName(data.roomName);
            setInGame(true);
        });

        socket.on('stateUpdate', (data) => {
            setPlayers(data.players);
            setMobs(data.mobs);
            setWorld(data.world);
        });

        socket.on('deltaUpdate', (data) => {
            setPlayers(data.players);
            setMobs(data.mobs);
            if (data.tiles && data.tiles.length > 0) {
                setWorld((prev) => {
                    if (!prev || prev.length === 0) return prev;
                    const copy = prev.map((row) => [...row]);
                    for (const { x, y, tile } of data.tiles) {
                        copy[y][x] = tile;
                    }
                    return copy;
                });
            }
        });

        socket.on('leaderboard', (board) => {
            setLeaderboard(board);
        });

        socket.on('tileUpdate', ({ x, y, tile }) => {
            setWorld((prev) => {
                if (!prev || prev.length === 0) return prev;
                const copy = prev.map((row) => [...row]);
                copy[y][x] = tile;
                return copy;
            });
        });

        socket.on('playerLeft', ({ id }) => {
            setPlayers((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        });

        socket.on('matchOver', ({ winnerName, score }) => {
            setMatchWinner({ winnerName, score });
        });

        socket.on('matchClosed', () => {
            setInGame(false);
            setRoomId(null);
            setRoomName('');
            setWorld([]);
            setPlayers({});
            setMobs({});
            setLeaderboard([]);
            setMatchWinner(null);
        });

        socket.on('respawn', ({ x, y }) => {
            // Handled via stateUpdate
        });

        return () => {
            clearInterval(pingInterval);
            socket.disconnect();
        };
    }, []);

    const emit = useCallback((event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    }, []);

    // Room actions
    const createRoom = useCallback((name, playerName) => {
        if (socketRef.current) {
            socketRef.current.emit('createRoom', { name, playerName });
        }
    }, []);

    const joinRoom = useCallback((roomId, playerName) => {
        if (socketRef.current) {
            socketRef.current.emit('joinRoom', { roomId, playerName });
        }
    }, []);

    const leaveRoom = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leaveRoom');
        }
    }, []);

    const refreshRooms = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('listRooms');
        }
    }, []);

    return {
        connected,
        myId,
        world,
        players,
        mobs,
        emit,
        ping,
        leaderboard,
        matchWinner,
        // Room state
        inGame,
        roomId,
        roomName,
        roomList,
        // Room actions
        createRoom,
        joinRoom,
        leaveRoom,
        refreshRooms,
    };
}
