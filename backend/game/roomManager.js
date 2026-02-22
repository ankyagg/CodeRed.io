const Room = require('./room');

// In-memory registry of active rooms
const rooms = {};

// Map socketId → roomId for quick lookup
const playerRoomMap = {};

/**
 * Create a new room.
 */
function createRoom(name, hostId) {
    const room = new Room(name, hostId);
    rooms[room.id] = room;
    return room;
}

/**
 * Join an existing room.
 */
function joinRoom(roomId, socketId, playerName, avatar) {
    const room = rooms[roomId];
    if (!room) return null;

    const player = room.addPlayer(socketId, playerName, avatar);
    playerRoomMap[socketId] = roomId;
    return { room, player };
}

/**
 * Leave a room. Destroys the room if empty.
 */
function leaveRoom(socketId) {
    const roomId = playerRoomMap[socketId];
    if (!roomId) return null;

    const room = rooms[roomId];
    if (!room) {
        delete playerRoomMap[socketId];
        return null;
    }

    const isEmpty = room.removePlayer(socketId);
    delete playerRoomMap[socketId];

    if (isEmpty) {
        room.destroy();
        delete rooms[roomId];
        console.log(`Room "${room.name}" (${roomId}) destroyed — no players left`);
    }

    return room;
}

/**
 * Get the room a socket is currently in.
 */
function getRoom(roomId) {
    return rooms[roomId] || null;
}

/**
 * Get the room a player is in by their socket ID.
 */
function getRoomByPlayer(socketId) {
    const roomId = playerRoomMap[socketId];
    if (!roomId) return null;
    return rooms[roomId] || null;
}

/**
 * List all rooms for lobby display.
 */
function listRooms() {
    return Object.values(rooms).map(room => room.getInfo());
}

module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    getRoom,
    getRoomByPlayer,
    listRooms,
};
