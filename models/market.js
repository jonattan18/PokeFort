const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
    Primary: Boolean,
    Last_Unique_Value: Number,
    MarketID: Number,
    UserID: String,
    PokemonId: String,
    PokemonUID: String,
    PokemonName: String,
    CatchedOn: { type: Number, default: Date.now() },
    Level: Number,
    Experience: Number,
    Type: Array,
    Nature: String,
    NatureValue: Number,
    Moves: { 1: String, 2: String, 3: String, 4: String },
    TmMoves: Array,
    IVPercentage: Number,
    IV: [Number, Number, Number, Number, Number, Number],
    Shiny: Boolean,
    Held: String,
    Price: Number,
    Nickname: String,
    Reason: String,
    Mega: String
});

const MessageModel = module.exports = mongoose.model('markets', MarketSchema);