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
    Hint: { type: Number, default: 0 }
});

const MessageModel = module.exports = mongoose.model('channels', ChannelSchema);