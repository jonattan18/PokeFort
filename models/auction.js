const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
    Primary: Boolean,
    Last_Unique_Value: Number,
    AuctionID: Number,
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
    BidUser: String,
    Nickname: String,
    Reason: String,
    Mega: String,
    BidTime: Number
});

const MessageModel = module.exports = mongoose.model('auctions', AuctionSchema);