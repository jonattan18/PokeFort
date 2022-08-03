// Models
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');
const mongoose = require('mongoose');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (interaction.options.get('id') == null) return interaction.reply({ content: `No Pokémon mentioned to add to favourites.`, ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);
        getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {


            if (typeof user_pokemons[interaction.options.get('id').value - 1] != 'undefined') {
                var selected_pokemon = user_pokemons[interaction.options.get('id').value - 1];
            }
            else return interaction.reply({ content: "No pokémon exists with that number.", ephemeral: true });

            // If pokemon is already in favourites.
            if (selected_pokemon.Favourite == true) return interaction.reply({ content: "This pokémon is already in your favourites.", ephemeral: true });
            pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].Favourite": true } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                show_msg();
            });

            function show_msg() {
                if (selected_pokemon.Nickname == undefined || selected_pokemon.Nickname == "") {
                    var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);
                    interaction.reply({ content: `Added your level ${selected_pokemon.Level} ${pokemon_name} to your favourites!` });
                }
                else {
                    var pokemon_name = selected_pokemon.Nickname;
                    if (selected_pokemon.Shiny) { pokemon_name = "Shiny " + pokemon_name; }
                    interaction.reply({ content: `Added your level ${selected_pokemon.Level} ${pokemon_name} to your favourites!` });
                }
            }
        });
    });

}

module.exports.config = {
    name: "addfavourite",
    description: "Adds a pokémon to your favourites.",
    options: [{
        name: "id",
        description: "The ID of the pokémon to add to your favourites.",
        required: true,
        type: 4,
        min_value: 1,
    }],
    aliases: []
}