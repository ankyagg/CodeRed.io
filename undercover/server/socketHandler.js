// Socket Event Handler Module

import {
  GAME_STATES,
  createRoom,
  createPlayer,
  assignWords,
  generateMatchPercentages,
  generateIntel,
  getNextPlayer,
  checkGameOver,
  processVotes,
} from "./gameLogic.js";

// In-memory storage
const rooms = {}; // { roomId: roomData }
const playerToRoom = {}; // Map player socket to room ID

/**
 * Get list of all available rooms
 */
function getAvailableRooms() {
  return Object.values(rooms)
    .filter((room) => room.gameState === GAME_STATES.LOBBY)
    .map((room) => ({
      roomId: room.roomId,
      roomName: room.roomName,
      hostName: room.hostName,
      playerCount: Object.keys(room.players).length,
      createdAt: room.createdAt,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Initialize socket handlers
 */
export function initializeSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Send available rooms to newly connected player
    socket.emit("rooms_list", getAvailableRooms());

    // GET ROOMS LIST
    socket.on("get_rooms", () => {
      socket.emit("rooms_list", getAvailableRooms());
    });

    // CREATE ROOM
    socket.on("create_room", ({ playerName, roomName, avatarIndex }) => {
      const playerId = socket.id;
      const room = createRoom(playerId, playerName, socket.id, roomName);
      room.players[playerId].avatarIndex = avatarIndex || 0;
      const roomId = room.roomId;

      rooms[roomId] = room;
      playerToRoom[socket.id] = roomId;

      socket.join(roomId);

      socket.emit("room_joined", {
        roomId,
        playerId,
        room: sanitizeRoomForClient(room, playerId),
      });

      // Broadcast updated rooms list to all clients
      io.emit("rooms_list", getAvailableRooms());

      console.log(`Room created: "${roomName}" by ${playerName}`);
    });

    // JOIN ROOM
    socket.on("join_room", ({ roomId, playerName, avatarIndex }) => {
      const room = rooms[roomId];

      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (room.gameState !== GAME_STATES.LOBBY) {
        socket.emit("error", { message: "Game already in progress" });
        return;
      }

      const playerId = socket.id;
      const newPlayer = createPlayer(playerId, playerName, socket.id);
      newPlayer.avatarIndex = avatarIndex || 0;
      room.players[playerId] = newPlayer;
      playerToRoom[socket.id] = roomId;

      socket.join(roomId);

      // Notify player they joined
      socket.emit("room_joined", {
        roomId,
        playerId,
        room: sanitizeRoomForClient(room, playerId),
      });

      // Notify all players in room
      io.to(roomId).emit("player_joined", {
        player: sanitizePlayer(newPlayer),
        room: sanitizeRoomForClient(room, playerId),
      });

      // Broadcast updated rooms list
      io.emit("rooms_list", getAvailableRooms());

      console.log(`${playerName} joined room "${room.roomName}"`);
    });

    // TOGGLE READY
    socket.on("toggle_ready", () => {
      const roomId = playerToRoom[socket.id];
      const room = rooms[roomId];

      if (!room) return;

      const player = room.players[socket.id];
      if (!player || player.isHost) return;

      player.isReady = !player.isReady;

      io.to(roomId).emit("player_ready_changed", {
        playerId: socket.id,
        isReady: player.isReady,
        room: sanitizeRoomForClient(room, socket.id),
      });
    });

    // START GAME
    socket.on("start_game", () => {
      const roomId = playerToRoom[socket.id];
      const room = rooms[roomId];

      if (!room) return;

      const player = room.players[socket.id];
      if (!player || !player.isHost) {
        socket.emit("error", { message: "Only host can start game" });
        return;
      }

      const playerCount = Object.keys(room.players).length;
      if (playerCount < 3) {
        socket.emit("error", { message: "Need at least 3 players" });
        return;
      }

      // Check if all non-host players are ready
      const allReady = Object.values(room.players).every(
        (p) => p.isHost || p.isReady,
      );

      if (!allReady) {
        socket.emit("error", { message: "All players must be ready" });
        return;
      }

      // Initialize game
      const { players, trueWord, imposterWords } = assignWords(room.players);
      room.players = generateMatchPercentages(players);
      room.players = generateIntel(room.players);
      room.trueWord = trueWord;
      room.imposterWords = imposterWords;
      room.gameState = GAME_STATES.WORD_REVEAL;
      room.round = 1;

      // Send personalized data to each player
      Object.keys(room.players).forEach((playerId) => {
        const player = room.players[playerId];
        const playerSocket = io.sockets.sockets.get(player.socketId);

        if (playerSocket) {
          playerSocket.emit("game_started", {
            word: player.word,
            matchPercentage: player.matchPercentage,
            intel: player.intelTargetId
              ? {
                targetPlayerId: player.intelTargetId,
                targetPlayerName: room.players[player.intelTargetId].name,
              }
              : null,
            room: sanitizeRoomForClient(room, playerId),
          });
        }
      });

      // Broadcast updated rooms list (room no longer joinable)
      io.emit("rooms_list", getAvailableRooms());

      console.log(`Game started in room "${room.roomName}"`);

      // Auto-transition to clue phase after 8 seconds
      setTimeout(() => {
        startCluePhase(roomId, io);
      }, 8000);
    });

    // SUBMIT CLUE
    socket.on("submit_clue", ({ clue }) => {
      const roomId = playerToRoom[socket.id];
      const room = rooms[roomId];

      if (!room || room.gameState !== GAME_STATES.CLUE_PHASE) return;

      const player = room.players[socket.id];
      if (!player || room.currentTurnPlayerId !== socket.id) return;

      // Add clue to history
      room.clues.push({
        playerId: socket.id,
        playerName: player.name,
        clue,
        round: room.round,
      });

      // Broadcast clue to all players
      io.to(roomId).emit("clue_submitted", {
        playerId: socket.id,
        playerName: player.name,
        clue,
        clues: room.clues,
      });

      // Check if all alive players have given clues this round
      const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
      const cluesThisRound = room.clues.filter((c) => c.round === room.round);

      if (cluesThisRound.length >= alivePlayers.length) {
        // All players gave clues, move to voting
        // Give everyone 5 seconds to read the last clues
        setTimeout(() => {
          startVotingPhase(roomId, io);
        }, 5000);
      } else {
        // Next player's turn
        const nextPlayerId = getNextPlayer(room.players, socket.id);
        room.currentTurnPlayerId = nextPlayerId;

        io.to(roomId).emit("next_turn", {
          currentTurnPlayerId: nextPlayerId,
          currentTurnPlayerName: room.players[nextPlayerId].name,
        });
      }
    });

    // SUBMIT VOTE
    socket.on("submit_vote", ({ targetPlayerId }) => {
      const roomId = playerToRoom[socket.id];
      const room = rooms[roomId];

      if (!room || room.gameState !== GAME_STATES.VOTING_PHASE) return;

      const voter = room.players[socket.id];
      if (!voter || !voter.isAlive) return;

      const target = room.players[targetPlayerId];
      if (!target || !target.isAlive) return;

      room.votes[socket.id] = targetPlayerId;

      // Notify voter
      socket.emit("vote_recorded", { targetPlayerId });

      // Check if all alive players have voted
      const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
      const voteCount = Object.keys(room.votes).length;

      if (voteCount >= alivePlayers.length) {
        // All votes in, process results
        setTimeout(() => {
          processVotingResults(roomId, io);
        }, 1000);
      }
    });

    // CONTINUE AFTER RESULT
    socket.on("continue_game", () => {
      const roomId = playerToRoom[socket.id];
      const room = rooms[roomId];

      if (!room || room.gameState !== GAME_STATES.RESULT_PHASE) return;

      const player = room.players[socket.id];
      if (!player || !player.isHost) return;

      // Check game over
      const gameOverCheck = checkGameOver(room.players);

      if (gameOverCheck.gameOver) {
        // Game ended
        io.to(roomId).emit("game_ended", {
          winner: gameOverCheck.winner,
          reason: gameOverCheck.reason,
          players: Object.values(room.players).map((p) => ({
            ...sanitizePlayer(p),
            word: p.word,
            isImposter: p.isImposter,
          })),
          trueWord: room.trueWord,
        });

        // Reset room to lobby after delay
        setTimeout(() => {
          resetRoom(roomId);
          io.to(roomId).emit("room_reset", {
            room: sanitizeRoomForClient(room, socket.id),
          });
          // Broadcast updated rooms list
          io.emit("rooms_list", getAvailableRooms());
        }, 10000);
      } else {
        // Continue to next round
        room.round++;
        startCluePhase(roomId, io);
      }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const roomId = playerToRoom[socket.id];

      if (roomId && rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players[socket.id];

        if (player) {
          delete room.players[socket.id];
          delete playerToRoom[socket.id];

          // If host left, assign new host
          if (player.isHost) {
            const remainingPlayers = Object.values(room.players);
            if (remainingPlayers.length > 0) {
              remainingPlayers[0].isHost = true;
              remainingPlayers[0].isReady = true;
            }
          }

          // Delete room if empty
          if (Object.keys(room.players).length === 0) {
            delete rooms[roomId];
            console.log(`Room "${room.roomName}" deleted (empty)`);
            // Broadcast updated rooms list
            io.emit("rooms_list", getAvailableRooms());
          } else {
            io.to(roomId).emit("player_left", {
              playerId: socket.id,
              playerName: player.name,
              room: sanitizeRoomForClient(room, socket.id),
            });
            // Broadcast updated rooms list
            io.emit("rooms_list", getAvailableRooms());
          }
        }
      }

      console.log(`Player disconnected: ${socket.id}`);
    });
  });
}

// Helper functions

function startCluePhase(roomId, io) {
  const room = rooms[roomId];
  if (!room) return;

  room.gameState = GAME_STATES.CLUE_PHASE;
  room.votes = {};

  // Set first alive player as current turn
  const alivePlayers = Object.values(room.players).filter((p) => p.isAlive);
  room.currentTurnPlayerId = alivePlayers[0]?.id;

  io.to(roomId).emit("clue_phase_started", {
    currentTurnPlayerId: room.currentTurnPlayerId,
    currentTurnPlayerName: room.players[room.currentTurnPlayerId]?.name,
    round: room.round,
  });
}

function startVotingPhase(roomId, io) {
  const room = rooms[roomId];
  if (!room) return;

  room.gameState = GAME_STATES.VOTING_PHASE;
  room.votes = {};

  io.to(roomId).emit("voting_phase_started", {
    players: Object.values(room.players)
      .filter((p) => p.isAlive)
      .map((p) => sanitizePlayer(p)),
  });
}

function processVotingResults(roomId, io) {
  const room = rooms[roomId];
  if (!room) return;

  const result = processVotes(room.votes, room.players);
  room.gameState = GAME_STATES.RESULT_PHASE;

  let eliminatedPlayer = null;
  if (result.eliminatedId) {
    eliminatedPlayer = room.players[result.eliminatedId];
    room.eliminatedPlayers.push({
      ...sanitizePlayer(eliminatedPlayer),
      word: eliminatedPlayer.word,
      isImposter: eliminatedPlayer.isImposter,
      round: room.round,
    });
  }

  io.to(roomId).emit("voting_results", {
    eliminatedPlayer: eliminatedPlayer
      ? {
        ...sanitizePlayer(eliminatedPlayer),
        word: eliminatedPlayer.word,
        isImposter: eliminatedPlayer.isImposter,
      }
      : null,
    tie: result.tie,
    votes: result.votes,
  });
}

function resetRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.gameState = GAME_STATES.LOBBY;
  room.trueWord = null;
  room.imposterWords = [];
  room.currentTurnPlayerId = null;
  room.clues = [];
  room.votes = {};
  room.round = 0;
  room.eliminatedPlayers = [];

  Object.values(room.players).forEach((player) => {
    player.word = null;
    player.isImposter = false;
    player.matchPercentage = 0;
    player.intelTargetId = null;
    player.isAlive = true;
    player.isReady = player.isHost;
  });
}

function sanitizePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    isAlive: player.isAlive,
    isReady: player.isReady,
    isHost: player.isHost,
    avatarIndex: player.avatarIndex,
  };
}

function sanitizeRoomForClient(room, requestingPlayerId) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    gameState: room.gameState,
    players: Object.values(room.players).map((p) => sanitizePlayer(p)),
    currentTurnPlayerId: room.currentTurnPlayerId,
    clues: room.clues,
    round: room.round,
    myPlayerId: requestingPlayerId,
  };
}
