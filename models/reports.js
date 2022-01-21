const mongoose = require('mongoose');

const ReportsSchema = new mongoose.Schema({
    UserID: String,
    Reason: String
});

const MessageModel = module.exports = mongoose.model('reports', ReportsSchema);