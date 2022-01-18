// Load Model Data.
const pokemons_model = require('../models/pokemons');

// Load Config Data.
const config = require('../config/config.json');

// Function to get all pokemons from a given user id.
let getallpokemon = (UserID) => new Promise((resolve, reject) => {
    pokemons_model.find({ UserID: UserID }).exec(function (err, pokemon_data) {
        if (err) reject(err);
        var total_pokemons = [];
        for (i = 0; i < pokemon_data.length; i++) {
            for (j = 0; j < pokemon_data[i].Pokemons.length; j++) {
                total_pokemons.push(pokemon_data[i].Pokemons[j]);
            }
        }
        resolve(total_pokemons);
    });
    setTimeout(resolve, 5000);
});

// Function get pokemon from user id.
function getpokemon(UserID, PokemonId) {

}

// Function to insert a pokemon to user id.
let insertpokemon = (UserID, Pokemons) => new Promise((resolve, reject) => {
    pokemons_model.find({ UserID: UserID }).sort({ _id: -1 }).limit(1).exec(function (err, pokemon_data) {
        if (err) reject(err);

        // No database found. Create new and insert pokemons.
        if (pokemon_data.length == 0) {
            let new_pokemon_database = new pokemons_model({
                UserID: UserID,
                Pokemons: [Pokemons]
            });
            new_pokemon_database.save(function (err, saved) {
                if (err) reject(err);
                resolve(saved);
            });
        }

        // Database found. But pokemons slot are full.
        else if (config.POKEMON_IN_SLOT <= pokemon_data[0].Pokemons.length) {
            // Create new pokemon document for same user id.
            let new_pokemon_database = new pokemons_model({
                UserID: UserID,
                Pokemons: [Pokemons]
            });
            new_pokemon_database.save(function (err, saved) {
                if (err) reject(err);
                resolve(saved);
            });
        }

        // Database found. But pokemons slot are not full.
        else {
            // Push new pokemons to database.
            pokemons_model.findOneAndUpdate({ _id: pokemon_data[0]._id }, { $push: { Pokemons: Pokemons } }, function (err, updated) {
                if (err) reject(err);
                resolve(updated);
            });
        }
    });
    setTimeout(resolve, 5000);
});

// Function to delete a pokemon from user id.
function deletepokemon(UserID, PokemonIds) {

}

module.exports = { getallpokemon, getpokemon, insertpokemon, deletepokemon };