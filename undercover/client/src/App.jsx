// Main App Component - State Management and Routing

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import socket from "./socket";

// Screens
import HomeScreen from "./screens/HomeScreen";
import LobbyScreen from "./screens/LobbyScreen";
import WordRevealScreen from "./screens/WordRevealScreen";
import CluePhaseScreen from "./screens/CluePhaseScreen";
import VotingPhaseScreen from "./screens/VotingPhaseScreen";
import ResultPhaseScreen from "./screens/ResultPhaseScreen";
import GameEndScreen from "./screens/GameEndScreen";

// Game states
const GAME_STATES = {
  HOME: "HOME",
  LOBBY: "LOBBY",
  WORD_REVEAL: "WORD_REVEAL",
  CLUE_PHASE: "CLUE_PHASE",
  VOTING_PHASE: "VOTING_PHASE",
  RESULT_PHASE: "RESULT_PHASE",
  GAME_END: "GAME_END",
};

import { TransitionScreen } from "./components/ui/TransitionScreen";

function App() {
  const [showTransition, setShowTransition] = useState(true);
  const [currentState, setCurrentState] = useState(GAME_STATES.HOME);
  const [room, setRoom] = useState(null);
  // reference for animation
  const appRef = useRef(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Game data
  const [myWord, setMyWord] = useState(null);
  const [myMatchPercentage, setMyMatchPercentage] = useState(null);
  const [myIntel, setMyIntel] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState(null);
  const [clues, setClues] = useState([]);

  // Result data
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [voteTie, setVoteTie] = useState(false);
  const [votes, setVotes] = useState(null);

  // Game end data
  const [gameEndData, setGameEndData] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect socket
    socket.connect();

    // Socket event listeners

    socket.on("rooms_list", (rooms) => {
      setAvailableRooms(rooms);
      console.log("Rooms list updated:", rooms.length, "available rooms");
    });

    socket.on("room_joined", ({ roomId, playerId, room: roomData }) => {
      setMyPlayerId(playerId);
      setRoom(roomData);
      setCurrentState(GAME_STATES.LOBBY);
      console.log("Joined room:", roomData.roomName);
    });

    socket.on("player_joined", ({ room: roomData }) => {
      setRoom(roomData);
    });

    socket.on("player_left", ({ room: roomData }) => {
      setRoom(roomData);
    });

    socket.on("player_ready_changed", ({ room: roomData }) => {
      setRoom(roomData);
    });

    socket.on(
      "game_started",
      ({ word, matchPercentage, intel, room: roomData }) => {
        setMyWord(word);
        setMyMatchPercentage(matchPercentage);
        setMyIntel(intel);
        setRoom(roomData);
        setCurrentState(GAME_STATES.WORD_REVEAL);
        console.log("Game started! Your word:", word);
      },
    );

    socket.on(
      "clue_phase_started",
      ({
        currentTurnPlayerId: turnId,
        currentTurnPlayerName: turnName,
        round,
      }) => {
        setCurrentTurnPlayerId(turnId);
        setCurrentTurnPlayerName(turnName);
        setCurrentState(GAME_STATES.CLUE_PHASE);
        console.log("Clue phase started, round:", round);
      },
    );

    socket.on(
      "clue_submitted",
      ({ playerId, playerName, clue, clues: allClues }) => {
        setClues(allClues);
        console.log(`${playerName} submitted clue: ${clue}`);
      },
    );

    socket.on(
      "next_turn",
      ({ currentTurnPlayerId: turnId, currentTurnPlayerName: turnName }) => {
        setCurrentTurnPlayerId(turnId);
        setCurrentTurnPlayerName(turnName);
      },
    );

    socket.on("voting_phase_started", () => {
      setCurrentState(GAME_STATES.VOTING_PHASE);
      console.log("Voting phase started");
    });

    socket.on("vote_recorded", ({ targetPlayerId }) => {
      console.log("Your vote was recorded for:", targetPlayerId);
    });

    socket.on(
      "voting_results",
      ({ eliminatedPlayer: eliminated, tie, votes: voteData }) => {
        setEliminatedPlayer(eliminated);
        setVoteTie(tie);
        setVotes(voteData);
        setCurrentState(GAME_STATES.RESULT_PHASE);
        console.log(
          "Voting results:",
          eliminated ? `${eliminated.name} eliminated` : "Tie",
        );
      },
    );

    socket.on("game_ended", ({ winner, reason, players, trueWord }) => {
      setGameEndData({ winner, reason, players, trueWord });
      setCurrentState(GAME_STATES.GAME_END);
      console.log("Game ended. Winner:", winner);
    });

    socket.on("room_reset", ({ room: roomData }) => {
      // Reset all game state
      setRoom(roomData);
      setMyWord(null);
      setMyMatchPercentage(null);
      setMyIntel(null);
      setCurrentTurnPlayerId(null);
      setCurrentTurnPlayerName(null);
      setClues([]);
      setEliminatedPlayer(null);
      setVoteTie(false);
      setVotes(null);
      setGameEndData(null);
      setCurrentState(GAME_STATES.LOBBY);
      console.log("Room reset to lobby");
    });

    socket.on("error", ({ message }) => {
      setError(message);
      alert("Error: " + message);
      console.error("Socket error:", message);
    });

    return () => {
      socket.off("rooms_list");
      socket.off("room_joined");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("player_ready_changed");
      socket.off("game_started");
      socket.off("clue_phase_started");
      socket.off("clue_submitted");
      socket.off("next_turn");
      socket.off("voting_phase_started");
      socket.off("vote_recorded");
      socket.off("voting_results");
      socket.off("game_ended");
      socket.off("room_reset");
      socket.off("error");
    };
  }, []);

  // play a quick fade-in everytime the state changes
  useEffect(() => {
    if (appRef.current) {
      import("gsap").then(({ gsap }) => {
        gsap.fromTo(appRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      });
    }
  }, [currentState]);

  // Action handlers

  const handleCreateRoom = (playerName, roomName, avatarIndex) => {
    socket.emit("create_room", { playerName, roomName, avatarIndex });
  };

  const handleJoinRoom = (roomId, playerName, avatarIndex) => {
    socket.emit("join_room", { roomId, playerName, avatarIndex });
  };

  const handleRefreshRooms = () => {
    socket.emit("get_rooms");
  };

  const handleToggleReady = () => {
    socket.emit("toggle_ready");
  };

  const handleStartGame = () => {
    socket.emit("start_game");
  };

  const handleSubmitClue = (clue) => {
    socket.emit("submit_clue", { clue });
  };

  const handleSubmitVote = (targetPlayerId) => {
    socket.emit("submit_vote", { targetPlayerId });
  };

  const handleContinue = () => {
    socket.emit("continue_game");
  };

  // Render appropriate screen based on game state

  const renderScreen = () => {
    switch (currentState) {
      case GAME_STATES.HOME:
        return (
          <HomeScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            availableRooms={availableRooms}
            onRefreshRooms={handleRefreshRooms}
          />
        );

      case GAME_STATES.LOBBY:
        return (
          <LobbyScreen
            room={room}
            myPlayerId={myPlayerId}
            onToggleReady={handleToggleReady}
            onStartGame={handleStartGame}
          />
        );

      case GAME_STATES.WORD_REVEAL:
        return (
          <WordRevealScreen
            word={myWord}
            matchPercentage={myMatchPercentage}
            intel={myIntel}
          />
        );

      case GAME_STATES.CLUE_PHASE:
        return (
          <CluePhaseScreen
            room={room}
            myPlayerId={myPlayerId}
            currentTurnPlayerId={currentTurnPlayerId}
            currentTurnPlayerName={currentTurnPlayerName}
            clues={clues}
            onSubmitClue={handleSubmitClue}
          />
        );

      case GAME_STATES.VOTING_PHASE:
        return (
          <VotingPhaseScreen
            room={room}
            myPlayerId={myPlayerId}
            onSubmitVote={handleSubmitVote}
          />
        );

      case GAME_STATES.RESULT_PHASE:
        return (
          <ResultPhaseScreen
            eliminatedPlayer={eliminatedPlayer}
            tie={voteTie}
            votes={votes}
            room={room}
            myPlayerId={myPlayerId}
            onContinue={handleContinue}
          />
        );

      case GAME_STATES.GAME_END:
        return gameEndData ? (
          <GameEndScreen
            winner={gameEndData.winner}
            reason={gameEndData.reason}
            players={gameEndData.players}
            trueWord={gameEndData.trueWord}
          />
        ) : null;

      default:
        return <div className="text-center p-8">Loading...</div>;
    }
  };

  return (
    <div
      ref={appRef}
      className="min-h-screen bg-black relative overflow-hidden"
    >
      <AnimatePresence>
        {showTransition && (
          <TransitionScreen onComplete={() => setShowTransition(false)} />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {renderScreen()}
      </div>

      {/* Persistent Word Display */}
      {!showTransition &&
        myWord &&
        currentState !== GAME_STATES.HOME &&
        currentState !== GAME_STATES.LOBBY &&
        currentState !== GAME_STATES.GAME_END && (
          <div className="absolute top-4 right-4 z-50 glass px-4 py-2 rounded-xl flex flex-col items-end border-white/10 shadow-lg pointer-events-none">
            <span className="text-[10px] text-zinc-500 font-orbitron tracking-[0.2em] uppercase">
              Assigned Objective
            </span>
            <span className="text-sm font-bold tracking-wider text-cyan-400">
              {myWord}
            </span>
          </div>
        )}
    </div>
  );
}

export default App;
