const mongoose = require('mongoose');

const StarterPackSchema = new mongoose.Schema({
    UserID: String,
    Mails: [{
        From: String,
        Subject: String,
        Message: String,
        ImageURL: String,
        Attachment: {
            PokeCredits: Number,
            Shards: Number,
            Redeems: Number,
            WishingPieces: Number,
            Pokemons: [{
                PokemonId: Number,
                Experience: Number,
                Level: Number,
                Nature: Number,
                IV: Array,
                Shiny: Boolean,
                Reason: String
            }],
            Badges: Array
        },
        Claimed: { type: Boolean, default: false },
        Read: { type: Boolean, default: false },
        Timestamp: Number
    }]
});

const MessageModel = module.exports = mongoose.model('StarterPack', StarterPackSchema)