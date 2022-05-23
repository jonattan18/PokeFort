const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    ChannelID: String,
    ChannelName: String,
    MessageCount: Number,
    SpawnLimit: Number,
    PokemonID: { type: Number, default: 0 },
    Shiny: { type: Boolean, default: false },
    PokemonLevel: Number,
    PokemonNature: Number,
    PokemonIV: Array,
    Disabled: { type: Boolean, default: false },
    Silence: { type: Boolean, default: false },
    MessageID: String,
    ClearSpawns: { type: Boolean, default: false },
    Hint: { type: Number, default: 0 }
});

const MessageModel = module.exports = mongoose.model('channels', ChannelSchema);