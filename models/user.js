const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    UserID: Number,
    Joined: Number,
    OrderType: String,
    PokeCredits: Number,
    Silence: Boolean,
    Selected: String,
    Redeems: Number,
    Shards: Number,
    DailyStreak: Number,
    RaidsCompleted: Number,
    WishingPieces: Number,
    Badges: Array,
    Admin: { type: Number, default: 0 },
    Favourites: Array,
    TotalCaught: Number,
    TotalShiny: Number,
    DexRewards: [{
        PokemonId: Number,
        RewardName: String,
        RewardAmount: Number,
        RewardDescription: String
    }]
});

const MessageModel = module.exports = mongoose.model('users', UserSchema)