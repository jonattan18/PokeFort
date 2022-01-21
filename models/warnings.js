const mongoose = require('mongoose');

const WarningsSchema = new mongoose.Schema({
    UserID: String,
    Reason: String
});

const MessageModel = module.exports = mongoose.model('warnings', WarningsSchema);