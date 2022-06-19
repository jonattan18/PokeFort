const mongoose = require('mongoose');

const LeaderBoardSchema = new mongoose.Schema({
    Type: String,
    Users: [{
        _id: false,
        UserID: String,
        Username: String,
        NoOfCaught: Number
    }],
    Timestamp: Number
});

const MessageModel = module.exports = mongoose.model('leaderboards', LeaderBoardSchema);