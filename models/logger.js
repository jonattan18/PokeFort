const mongoose = require('mongoose');

const LoggerSchema = new mongoose.Schema({
    Time: {type: Number, default: Date.now()},
    Message: String
});

const MessageModel = module.exports = mongoose.model('logs', LoggerSchema);