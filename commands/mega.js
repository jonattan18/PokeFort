// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length > 1) return message.channel.send("Invalid Syntax!")

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var mega_type = selected_pokemon.Mega;

            if (mega_type == undefined || mega_type == "" || mega_type == null) return message.channel.send(`You don't have or have not purchased a mega evolution for this pokemon!`);
            else {
                if (mega_type == "Mega" && args.length == 0) {
                    var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && (it["Alternate Form Name"] == "Mega" || it["Alternate Form Name"] == "Primal"))[0];
                }
                else if (mega_type == "Mega X" && args.length == 1 && args[0].toLowerCase() == "x") {
                    var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega X")[0];
                }
                else if (mega_type == "Mega Y" && args.length == 1 && args[0].toLowerCase() == "y") {
                    var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega Y")[0];
                }
                else return message.channel.send(`You don't have or have not purchased a mega evolution for this pokemon!`);
                if (pokemon_db["Pokemon Id"] == selected_pokemon.PokemonId) {
                    var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "NULL")[0];
                }
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": pokemon_db["Pokemon Id"] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    message.channel.send(`You ${getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny)} is now ${getPokemons.get_pokemon_name_from_id(pokemon_db["Pokemon Id"], pokemons, selected_pokemon.Shiny)}!`);
                });
            }
        });
    });
}

module.exports.config = {
    name: "mega",
    aliases: []
}