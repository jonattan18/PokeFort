const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    UserID: Number,
    Started: Boolean,
    Joined: Number,
    PokeCredits: Number,
    Selected: String,
    Admin: { type: Number, default: 0 },
    Pokemons: [{
        PokemonId: Number,
        Nickname: String,
        CatchedOn: { type: Number, default: Date.now() },
        Experience: Number,
        IV: Array,
        Nature : Number,
        Level: Number,
        Shiny: Boolean,
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