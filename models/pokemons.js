const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
        UserID: String,
        Pokemons: [{
                PokemonId: String,
                CatchedOn: { type: Number, default: Date.now() },
                Experience: Number,
                Level: Number,
                Nature: Number,
                Moves: [],
                TMOVES: [],
                IV: [Number, Number, Number, Number, Number, Number],
                Shiny: Boolean,
                Reason: String,
                Nickname: String,
                Favourite: Boolean
        }]
});

const MessageModel = module.exports = mongoose.model('pokemons', PokemonSchema);