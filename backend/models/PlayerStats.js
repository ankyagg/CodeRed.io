const mongoose = require('mongoose');

const playerStatsSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true,
        unique: true
    },
    nickname: {
        type: String,
        required: true
    },
    totalScore: {
        type: Number,
        default: 0
    },
    totalKills: {
        type: Number,
        default: 0
    },
    totalDeaths: {
        type: Number,
        default: 0
    },
    blocksBroken: {
        type: Number,
        default: 0
    },
    bestSurvivalTimeSeconds: {
        type: Number,
        default: 0
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    lastPlayedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const PlayerStats = mongoose.model('PlayerStats', playerStatsSchema);

module.exports = PlayerStats;
