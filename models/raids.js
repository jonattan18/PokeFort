const mongoose = require('mongoose');

const RaidSchema = new mongoose.Schema({
    RaidID: Number,
    Leader: String,
    Started: Boolean,
    Timestamp: Number,
    RaidPokemon: {
        ID: Number,
        Name: String,
        Level: Number,
        Health: Number,
        Attack: Number,
        Defense: Number,
        SpAttack: Number,
        SpDefense: Number,
        Speed: Number
    },
    Trainers: [{
        UserID: String,
        Username: String,
        Fight: Boolean
    }]
});

const MessageModel = module.exports = mongoose.model('raids', RaidSchema);