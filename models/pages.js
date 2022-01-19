const mongoose = require('mongoose');
const config = require('../config/config.json');

const PagesSchema = new mongoose.Schema({
    ChannelID: Number,
    UserID: Number,
    MessageID: String,
    Embed: Array,
    CurrentPage: { type: Number, default: 1 },
    createdAt: { type: Date, expires: config.PAGE_EXPIRATION_SECONDS, default: Date.now }
});

const MessageModel = module.exports = mongoose.model('pages', PagesSchema);