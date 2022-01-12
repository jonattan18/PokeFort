const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    ChannelID: Number,
    ChannelName: String,
    MessageCount: Number,
    SpawnLimit: Number,
    PokemonID: { type: Number, default: 0 },
    Shiny: { type: Boolean, default: false },
    PokemonLevel: Number,
    PokemonNature: Number,
    PokemonIV: Array,
    Hint: { type: Number, default: 0 },
    AcceptPrompt: String,
    Trade: {
        User1ID: String,
        User2ID: String,
        Accepted: Boolean,
        User1Items: Array,
        User2Items: Array,
        User1IConfirm: Boolean,
        User2IConfirm: Boolean,
        Credits: {
            User1: Number,
            User2: Number
        },
        Redeems: {
            User1: Number,
            User2: Number
        },
        Shards: {
            User1: Number,
            User2: Number
        },
        MessageID: String,
        Timestamp: { type: Number, default: Date.now() }
    },
    Prompt: {
        UserID: Number,
        Pokemons: Array,
        Timestamp: Number,
        Reason: String
    },
    Pagination: [{
        UserID: Number,
        Message: Array,
        Embed: Array,
        Timestamp: { type: Number, default: Date.now() },
        CurrentPage: { type: Number, default: 1 }
    }]
});

const MessageModel = module.exports = mongoose.model('channels', ChannelSchema);