const mongoose = require('mongoose');
const config = require('../config/config.json');

const PromptSchema = new mongoose.Schema({
    ChannelID: Number,
    PromptType: String,
    UserID: {
        User1ID: String,
        User2ID: String
    },
    Recycle: {
        Pokemons: Array
    },
    Release: {
        Pokemons: Array
    },
    Trade: {
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
        MessageID: String
    },
    Duel: {
        Accepted: Boolean,
        BattleData: Object
    },
    createdAt: { type: Date, expires: config.PROMPT_EXPIRATION_SECONDS, default: Date.now }
});

const MessageModel = module.exports = mongoose.model('prompt', PromptSchema);