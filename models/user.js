const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    UserID: String,
    Joined: Number,
    OrderType: String,
    PokeCredits: Number,
    Silence: Boolean,
    DuelDM: Boolean,
    Selected: String,
    Redeems: Number,
    Shards: Number,
    DailyStreak: Number,
    RaidsCompleted: Number,
    WishingPieces: Number,
    Badges: Array,
    Admin: Number,
    TotalCaught: Number,
    TotalShiny: Number,
    MoveReplace: Array,
    TotalDueled: Number,
    DuelWon: Number,
    Boosters: { Hours: Number, Level: Number, Timestamp: Number },
    Suspend: { Hours: Number, Reason: String, Timestamp: Number },
    DexRewards: [{
        PokemonId: Number,
        RewardName: String,
        RewardAmount: Number,
        RewardDescription: String
    }]
});

const MessageModel = module.exports = mongoose.model('users', UserSchema)