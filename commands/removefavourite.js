const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);
        getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {

            var user_requested_id = interaction.options.get("id").value;
            var user_pokemons = pokemons_from_database;
            // If arguments is number
            if (isInt(user_requested_id)) {
                if (typeof user_pokemons[user_requested_id - 1] != 'undefined') {
                    var selected_pokemon = user_pokemons[user_requested_id - 1];
                }
                else {
                    interaction.reply({ content: "No pokemon exists with that number.", ephemeral: true });
                    return;
                }
            }
            else return interaction.reply({ content: "Invalid argument.", ephemeral: true });

            pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $unset: { "Pokemons.$[elem].Favourite": 1 } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                show_msg();
            });

            function show_msg() {
                if (selected_pokemon.Nickname == undefined || selected_pokemon.Nickname == "") {

                    //Get Pokemon Name from Pokemon ID.
                    var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);
                    interaction.reply({ content: `Removed your level ${selected_pokemon.Level} ${pokemon_name} from your favourites!` });
                }
                else {
                    var pokemon_name = selected_pokemon.Nickname;
                    if (selected_pokemon.Shiny) { pokemon_name = "Shiny " + pokemon_name; }
                    interaction.reply({ content: `Removed your level ${selected_pokemon.Level} ${pokemon_name} from your favourites!` });
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
    name: "removefavourite",
    description: "Remove a pokemon from your favourites.",
    options: [{
        name: "id",
        description: "The ID of the pokémon to remove from your favourites.",
        required: true,
        type: 4,
        min_value: 1,
    }],
    aliases: []
}