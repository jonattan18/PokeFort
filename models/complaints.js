const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    UserID: String,
    ChannelID: String,
    GuildID: String,
    Reason: String,
    Timestamp: {type: Number, default: Date.now}
});

const MessageModel = module.exports = mongoose.model('complaints', ComplaintSchema);