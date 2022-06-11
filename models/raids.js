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
        Health: Number,
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
    TrainersTeam: Array
});

const MessageModel = module.exports = mongoose.model('raids', RaidSchema);