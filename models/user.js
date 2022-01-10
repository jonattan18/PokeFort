const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    UserID: Number,
    Started: Boolean,
    Joined: Number,
    OrderType: String,
    PokeCredits: Number,
    Selected: String,
    Redeems: Number,
    DailyStreak: Number,
    RaidsCompleted: Number,
    WishingPieces: Number,
    Admin: { type: Number, default: 0 },
    Pokemons: [{
        PokemonId: Number,
        Nickname: String,
        CatchedOn: { type: Number, default: Date.now() },
        Experience: Number,
        IV: Array,
        Nature: Number,
        Level: Number,
        Shiny: Boolean,
        Moves: Array,
        Reason: String,
        Favourite: Boolean,
    }],
    Released: [{
        PokemonId: Number,
        Nickname: String,
        CatchedOn: Number,
        ReleasedOn: { type: Number, default: Date.now() },
        Experience: Number,
        IV: Array,
        Nature: Number,
        Level: Number,
        Shiny: Boolean,
        Moves: Array,
        Reason: String
    }],
    Recycled: [{
        PokemonId: Number,
        Nickname: String,
        CatchedOn: Number,
        RecycledOn: { type: Number, default: Date.now() },
        Experience: Number,
        IV: Array,
        Nature: Number,
        Level: Number,
        Shiny: Boolean,
        Moves: Array,
        Reason: String
    }],
    DexRewards: [{
        PokemonId: Number,
        RewardName: String,
        RewardAmount: Number,
        RewardDescription: String
    }]
});

const MessageModel = module.exports = mongoose.model('users', ChannelSchema);