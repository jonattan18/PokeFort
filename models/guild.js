const mongoose = require('mongoose');
const config = require('../config/config.json')

const GuildSchema = new mongoose.Schema({
    Prefix: {type: String, default: config.DEFAULT_PREFIX},
    GuildID: String,
    GuildName: String,
    DateJoined: {type: Number, default: Date.now()}
});

const MessageModel = module.exports = mongoose.model('guilds', GuildSchema);