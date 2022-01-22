// Models
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');
const mongoose = require('mongoose');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length == 0) {
        message.channel.send("You have not mentioned any pokemon number. Use ``" + prefix + "addfav <pokemon number>`` or ``l`` for latest pokemon.");
        return;
    }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            // If arguments is latest or l
            if (args[0].toLowerCase() == "l" || args[0].toLowerCase() == "latest") {
                var selected_pokemon = user_pokemons[user_pokemons.length - 1];
            }
            // If arguments is number
            else if (isInt(args[0])) {
                if (typeof user_pokemons[args[0] - 1] != 'undefined') {
                    var selected_pokemon = user_pokemons[args[0] - 1];
                }
                else {
                    message.channel.send("No pokemon exists with that number.");
                    return;
                }
            }
            else return message.channel.send("Invalid argument.");

            // If pokemon is already in favourites.
            if (selected_pokemon.Favourite == true) { return message.channel.send("This pokemon is already in your favourites."); }
            pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].Favourite": true } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                show_msg();
            });

            function show_msg() {
                if (selected_pokemon.Nickname == undefined || selected_pokemon.Nickname == "") {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

                    //Get Pokemon Name from Pokemon ID.
                    if (pokemon_db["Alternate Form Name"] == "Mega X" || pokemon_db["Alternate Form Name"] == "Mega Y") {
                        var pokemon_name = `Mega ${pokemon_db["Pokemon Name"]} ${pokemon_db["Alternate Form Name"][pokemon_db["Alternate Form Name"].length - 1]}`
                    }
                    else {
                        var temp_name = "";
                        if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
                        else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
                        else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
                        else { temp_name = pokemon_db["Pokemon Name"]; }
                        var pokemon_name = temp_name;
                    }
                    if (selected_pokemon.Shiny) { pokemon_name = "Shiny " + pokemon_name; }
                    message.channel.send(`Added your level ${selected_pokemon.Level} ${pokemon_name} to your favourites!`);
                }
                else {
                    var pokemon_name = selected_pokemon.Nickname;
                    if (selected_pokemon.Shiny) { pokemon_name = "Shiny " + pokemon_name; }
                    message.channel.send(`Added your level ${selected_pokemon.Level} ${pokemon_name} to your favourites!`);
                }
            }
        });
    });

}

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "addfavourite",
    aliases: []
}