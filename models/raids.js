const mongoose = require('mongoose');

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
        Health: Number,
        MaxHealth: Number,
        Attack: Number,
        Defense: Number,
        SpAttack: Number,
        SpDefense: Number,
        Speed: Number,
        Weather: {
            Name: String,
            Turns: Number,
            MaxTurn: Number
        },
        Terrain: {
            Name: String,
            Turns: Number,
            MaxTurn: Number
        }
    },
    Trainers: Array,
    TrainersTag: Array,
    CurrentDuel: String,
    CompletedDuel: Array,
    CurrentPokemon: Number,
    TrainersTeam: [{
        UniqueID: String,
        ID: Number,
        Name: String,
        Level: Number,
        IV: Array,
        Type: [String, String],
        MaxHealth: Number,
        Health: Number,
        Attack: Number,
        Defense: Number,
        SpAttack: Number,
        SpDefense: Number,
        Image: [String, String],
        Speed: Number,
        Nature: String,
        Moves: Array,
        Fainted: Boolean
    }]
});

const MessageModel = module.exports = mongoose.model('raids', RaidSchema);