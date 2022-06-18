const mongoose = require('mongoose');
const config = require('../config/config.json');

const RaidSchema = new mongoose.Schema({
    RaidID: Number,
    RaidType: Number,
    Started: Boolean,
    Timestamp: Number,
    Ban: [String],
    RaidPokemon: {
        ID: Number,
        Name: String,
        Level: Number,
        Image: [String, String],
        Type: [String, String],
        IV: Array,
        Health: Number,
        MaxHealth: Number,
        Attack: Number,
        Defense: Number,
        SpAttack: Number,
        SpDefense: Number,
        Speed: Number,
        PreparationMove: Number,
        RaidStream: String
    },
    Trainers: Array,
    TrainersTag: Array,
    TrainersTeam: Array,
    CurrentDuel: String,
    CompletedDuel: Array,
    CurrentPokemon: Number,
    PreparationMove: Number,
    CurrentTurn: Number,
    Stream: String,
    OldStreamText: Number,
    ChangeOnFainted: Boolean,
    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: config.RAID_EXPIRATION_SECONDS },
    },
});

const MessageModel = module.exports = mongoose.model('raids', RaidSchema);