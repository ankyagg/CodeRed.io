import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const isNgrok = window.location.hostname.includes('ngrok');

// Extra options to inject Ngrok bypass headers if we are specifically on an Ngrok URL.
// Doing this indiscriminately breaks CORS on local network IPs (e.g. 192.168.x.x)
const extraHeaders = isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {};

export const socket = io({
    path: '/survival/socket.io',
    transports: ['polling', 'websocket'], // Must allow polling first to send ngrok headers!
    extraHeaders
});

export default function useSocket() {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(socket.connected);
    const [socketError, setSocketError] = useState(null);
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
    const [messages, setMessages] = useState([]);

    // Track ping start time
    const pingStartRef = useRef(0);

    useEffect(() => {
        socketRef.current = socket;

        // Immediately sync state if already connected!
        if (socket.connected) {
            setConnected(true);
        }

        const onConnect = () => {
            setConnected(true);
            setSocketError(null);
            // ...
        };

        const onConnectError = (err) => {
            console.error('Socket connection error:', err);
            setSocketError(err.message);
            setConnected(false);
        };

        const onDisconnect = () => {
            setConnected(false);
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.on('disconnect', onDisconnect);

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
            setMessages([]);
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

        socket.on('receive_chat', (msg) => {
            setMessages((prev) => [...prev, msg]);
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
            setMessages([]);
        });

        socket.on('respawn', ({ x, y }) => {
            // Handled via stateUpdate
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off('disconnect', onDisconnect);
            clearInterval(pingInterval);
        };
    }, []);

    const emit = useCallback((event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    }, []);

    // Room actions
    const createRoom = useCallback((name, playerName, avatar) => {
        if (socketRef.current) {
            socketRef.current.emit('createRoom', { name, playerName, avatar });
        }
    }, []);

    const joinRoom = useCallback((roomId, playerName, avatar) => {
        if (socketRef.current) {
            socketRef.current.emit('joinRoom', { roomId, playerName, avatar });
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

    const sendChat = useCallback((message) => {
        if (socketRef.current) {
            socketRef.current.emit('send_chat', { message });
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
        messages,
        sendChat,
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
        socketError,
    };
}
