const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
    UserID: String,
    InvitationCode: String,
    NoOfInvitation: Number,
    InvitedPerson: Array,
    UsedCode: Boolean
});

const MessageModel = module.exports = mongoose.model('Invitation', InvitationSchema)