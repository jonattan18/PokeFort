const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
    UserID: String,
    Pokemons: [{ PokemonId: String }]
});

const MessageModel = module.exports = mongoose.model('dexes', PokemonSchema);