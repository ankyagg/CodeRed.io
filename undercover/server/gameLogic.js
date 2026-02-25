// Game Logic Module - Handles all game mechanics

// Word database (populated from user-provided dataset)
// Each entry has a civilian (true) word and one or more undercover (imposter) words.
const WORD_PAIRS = [
  // food_and_drink
  { true: "Ice Cream", imposters: ["Sorbet"] },
  { true: "Burger", imposters: ["Sandwich"] },
  { true: "Pizza", imposters: ["Flatbread"] },
  { true: "Coffee", imposters: ["Espresso"] },
  { true: "Tea", imposters: ["Green Tea"] },
  { true: "Juice", imposters: ["Smoothie"] },
  { true: "Cake", imposters: ["Pastry"] },
  { true: "Chocolate", imposters: ["Candy"] },
  { true: "Fries", imposters: ["Wedges"] },
  { true: "Soup", imposters: ["Stew"] },

  // transport_and_travel
  { true: "Train", imposters: ["Subway"] },
  { true: "Bus", imposters: ["Coach"] },
  { true: "Taxi", imposters: ["Cab"] },
  { true: "Airport", imposters: ["Terminal"] },
  { true: "Plane", imposters: ["Jet"] },
  { true: "Ship", imposters: ["Ferry"] },
  { true: "Car", imposters: ["Sedan"] },
  { true: "Bike", imposters: ["Motorcycle"] },
  { true: "Highway", imposters: ["Expressway"] },
  { true: "Station", imposters: ["Platform"] },

  // places
  { true: "Library", imposters: ["Bookstore"] },
  { true: "Mall", imposters: ["Market"] },
  { true: "Hospital", imposters: ["Clinic"] },
  { true: "School", imposters: ["College"] },
  { true: "Office", imposters: ["Workplace"] },
  { true: "Hotel", imposters: ["Hostel"] },
  { true: "Beach", imposters: ["Seashore"] },
  { true: "Park", imposters: ["Garden"] },
  { true: "Museum", imposters: ["Gallery"] },
  { true: "Cafe", imposters: ["Restaurant"] },

  // home_and_everyday_life
  { true: "Sofa", imposters: ["Couch"] },
  { true: "Bed", imposters: ["Mattress"] },
  { true: "Kitchen", imposters: ["Pantry"] },
  { true: "Bathroom", imposters: ["Washroom"] },
  { true: "TV", imposters: ["Television"] },
  { true: "Phone", imposters: ["Smartphone"] },
  { true: "Laptop", imposters: ["Computer"] },
  { true: "Table", imposters: ["Desk"] },
  { true: "Door", imposters: ["Entrance"] },
  { true: "Window", imposters: ["Balcony"] },

  // actions_and_activities
  { true: "Running", imposters: ["Jogging"] },
  { true: "Cooking", imposters: ["Baking"] },
  { true: "Reading", imposters: ["Studying"] },
  { true: "Writing", imposters: ["Typing"] },
  { true: "Shopping", imposters: ["Browsing"] },
  { true: "Singing", imposters: ["Humming"] },
  { true: "Dancing", imposters: ["Grooving"] },
  { true: "Driving", imposters: ["Steering"] },
  { true: "Talking", imposters: ["Chatting"] },
  { true: "Watching", imposters: ["Streaming"] },

  // nature_and_outdoors
  { true: "Forest", imposters: ["Jungle"] },
  { true: "River", imposters: ["Stream"] },
  { true: "Mountain", imposters: ["Hill"] },
  { true: "Lake", imposters: ["Pond"] },
  { true: "Ocean", imposters: ["Sea"] },
  { true: "Rain", imposters: ["Drizzle"] },
  { true: "Snow", imposters: ["Ice"] },
  { true: "Sun", imposters: ["Sunshine"] },
  { true: "Wind", imposters: ["Breeze"] },
  { true: "Desert", imposters: ["Dunes"] },

  // tech_and_modern_life
  { true: "App", imposters: ["Software"] },
  { true: "Website", imposters: ["Webpage"] },
  { true: "Game", imposters: ["Simulator"] },
  { true: "Server", imposters: ["Database"] },
  { true: "Login", imposters: ["Sign-in"] },
  { true: "Password", imposters: ["Passcode"] },
  { true: "Camera", imposters: ["Webcam"] },
  { true: "Message", imposters: ["Notification"] },
  { true: "Call", imposters: ["Video Call"] },
  { true: "Cloud", imposters: ["Storage"] },

  // high_risk_spy_pairs
  { true: "Police Station", imposters: ["Court"] },
  { true: "Army Base", imposters: ["Training Camp"] },
  { true: "Bank", imposters: ["ATM Center"] },
  { true: "Research Lab", imposters: ["Testing Center"] },
  { true: "News Room", imposters: ["Media Office"] },
  { true: "Control Room", imposters: ["Server Room"] },
  { true: "Warehouse", imposters: ["Storage Unit"] },
  { true: "Border Check", imposters: ["Security Gate"] },
  { true: "Embassy", imposters: ["Consulate"] },
  { true: "Prison", imposters: ["Detention Center"] },
];

// Game state constants
export const GAME_STATES = {
  LOBBY: "LOBBY",
  WORD_REVEAL: "WORD_REVEAL",
  CLUE_PHASE: "CLUE_PHASE",
  VOTING_PHASE: "VOTING_PHASE",
  RESULT_PHASE: "RESULT_PHASE",
};

/**
 * Generate a unique room ID
 */
export function generateRoomId() {
  return (
    "room_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
  );
}

/**
 * Select random word pair from database
 */
export function selectWordPair() {
  return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
}

/**
 * Determine number of imposters based on player count
 */
export function getImposterCount(playerCount) {
  if (playerCount <= 4) return 1;
  if (playerCount <= 7) return 2;
  return 2; // Max 2 imposters
}

/**
 * Assign words to players
 * Returns modified players object with word and isImposter
 */
export function assignWords(players) {
  const playerIds = Object.keys(players);
  const playerCount = playerIds.length;

  // Select word pair
  const wordPair = selectWordPair();
  const trueWord = wordPair.true;
  const imposterWords = wordPair.imposters;

  // Determine imposters
  const imposterCount = getImposterCount(playerCount);
  const shuffledIds = [...playerIds].sort(() => Math.random() - 0.5);
  const imposterIds = shuffledIds.slice(0, imposterCount);

  // Assign words
  playerIds.forEach((playerId, index) => {
    const isImposter = imposterIds.includes(playerId);
    players[playerId].isImposter = isImposter;

    if (isImposter) {
      // Assign random imposter word
      const imposterIdx = imposterIds.indexOf(playerId);
      players[playerId].word =
        imposterWords[imposterIdx % imposterWords.length];
    } else {
      players[playerId].word = trueWord;
    }
  });

  return { players, trueWord, imposterWords };
}

/**
 * Generate match percentages for all players
 * FEATURE 1: Random Match Percentage (Paranoia System)
 */
export function generateMatchPercentages(players) {
  const playerIds = Object.keys(players);

  // Step 1: Assign base percentages between 80-98
  playerIds.forEach((playerId) => {
    const basePercentage = Math.floor(Math.random() * (98 - 80 + 1)) + 80;
    players[playerId].matchPercentage = basePercentage;
  });

  // Step 2: Select one random unlucky player
  const unluckyIndex = Math.floor(Math.random() * playerIds.length);
  const unluckyPlayerId = playerIds[unluckyIndex];

  // Step 3: Override with low percentage (55-70)
  players[unluckyPlayerId].matchPercentage =
    Math.floor(Math.random() * (70 - 55 + 1)) + 55;

  // Step 4: Add slight randomization ±3% to others
  playerIds.forEach((playerId) => {
    if (playerId !== unluckyPlayerId) {
      const adjustment = Math.floor(Math.random() * 7) - 3; // -3 to +3
      players[playerId].matchPercentage = Math.max(
        72,
        Math.min(98, players[playerId].matchPercentage + adjustment),
      );
    }
  });

  return players;
}

/**
 * Generate asymmetric intel system
 * FEATURE 2: Asymmetric Secret Intel System
 */
export function generateIntel(players) {
  const playerIds = Object.keys(players);

  // Get list of civilians only
  const civilianIds = playerIds.filter((id) => !players[id].isImposter);

  if (civilianIds.length === 0) {
    return players; // No civilians to reveal
  }

  // Shuffle players for random intel assignment
  const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

  // Randomly decide how many players get intel (30-60% of players)
  const intelRecipientCount = Math.max(
    1,
    Math.floor(playerIds.length * (0.3 + Math.random() * 0.3)),
  );

  // Assign intel asymmetrically
  const recipientIds = shuffledPlayers.slice(0, intelRecipientCount);

  recipientIds.forEach((recipientId) => {
    // Pick random civilian target (not self)
    const availableTargets = civilianIds.filter((id) => id !== recipientId);

    if (availableTargets.length > 0) {
      const targetId =
        availableTargets[Math.floor(Math.random() * availableTargets.length)];
      players[recipientId].intelTargetId = targetId;
    }
  });

  return players;
}

/**
 * Get next player for turn rotation
 */
export function getNextPlayer(players, currentPlayerId) {
  const alivePlayers = Object.keys(players).filter((id) => players[id].isAlive);

  if (alivePlayers.length === 0) return null;

  const currentIndex = alivePlayers.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % alivePlayers.length;

  return alivePlayers[nextIndex];
}

/**
 * Check if game is over and determine winner
 */
export function checkGameOver(players) {
  const alivePlayers = Object.values(players).filter((p) => p.isAlive);
  const aliveImposters = alivePlayers.filter((p) => p.isImposter);
  const aliveCivilians = alivePlayers.filter((p) => !p.isImposter);

  // Civilians win if all imposters eliminated
  if (aliveImposters.length === 0) {
    return {
      gameOver: true,
      winner: "CIVILIANS",
      reason: "All imposters eliminated",
    };
  }

  // Imposters win if they equal or outnumber civilians
  if (aliveImposters.length >= aliveCivilians.length) {
    return {
      gameOver: true,
      winner: "IMPOSTERS",
      reason: "Imposters control the vote",
    };
  }

  return { gameOver: false };
}

/**
 * Process votes and determine eliminated player
 */
export function processVotes(votes, players) {
  const voteCounts = {};

  // Count votes
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  // Find player with most votes
  let maxVotes = 0;
  let eliminatedId = null;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = playerId;
    }
  });

  // Handle tie - no elimination
  const playersWithMaxVotes = Object.entries(voteCounts).filter(
    ([_, count]) => count === maxVotes,
  );

  if (playersWithMaxVotes.length > 1) {
    return { eliminatedId: null, tie: true, votes: voteCounts };
  }

  if (eliminatedId) {
    players[eliminatedId].isAlive = false;
  }

  return { eliminatedId, tie: false, votes: voteCounts };
}

/**
 * Initialize player object
 */
export function createPlayer(id, name, socketId) {
  return {
    id,
    name,
    socketId,
    word: null,
    isImposter: false,
    matchPercentage: 0,
    intelTargetId: null,
    isAlive: true,
    isReady: false,
    isHost: false,
    avatarIndex: 0,
  };
}

/**
 * Create new game room
 */
export function createRoom(hostId, hostName, hostSocketId, roomName) {
  const roomId = generateRoomId();
  const hostPlayer = createPlayer(hostId, hostName, hostSocketId);
  hostPlayer.isHost = true;
  hostPlayer.isReady = true;

  return {
    roomId,
    roomName,
    hostName,
    players: {
      [hostId]: hostPlayer,
    },
    gameState: GAME_STATES.LOBBY,
    trueWord: null,
    imposterWords: [],
    currentTurnPlayerId: null,
    clues: [],
    votes: {},
    round: 0,
    eliminatedPlayers: [],
    createdAt: Date.now(),
  };
}
