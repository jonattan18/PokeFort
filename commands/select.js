// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return interaction.reply({ content: "You can't select pokémon while you are in a duel!", ephemeral: true });

        //Get user data.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);
            getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {

                var user_string = interaction.options.get("id").value;

                // If arguments is latest or l
                if (user_string.toLowerCase() == "l" || user_string.toLowerCase() == "latest") {
                    var selected_pokemon = user_pokemons[user_pokemons.length - 1];
                }
                // If arguments is number
                else if (isInt(user_string)) {
                    if (typeof user_pokemons[user_string - 1] != 'undefined') {
                        var selected_pokemon = user_pokemons[user_string - 1];
                    }
                    else {
                        interaction.reply({ content: "No pokémon exists with that number.", ephemeral: true });
                        return;
                    }
                }
                else return interaction.reply({ content: "Invalid argument.", ephemeral: true });

                if (user.Selected != undefined && user.Selected == selected_pokemon._id) return interaction.reply({ content: "You already have selected this pokémon.", ephemeral: true });

                user.Selected = selected_pokemon._id;
                user.save();

                if (selected_pokemon.Nickname == undefined || selected_pokemon.Nickname == "") {

                    //Get Pokemon Name from Pokemon ID.
                    var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);
                    interaction.reply({ content: `You have selected your level ${selected_pokemon.Level} ${pokemon_name}!` });
                }
                else {
                    var pokemon_name = selected_pokemon.Nickname;
                    if (selected_pokemon.Shiny) { pokemon_name = "Shiny " + pokemon_name; }
                    interaction.reply({ content: `You have selected your level ${selected_pokemon.Level} ${pokemon_name}!` });
                }
            });
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
    name: "select",
    description: "Selects a pokémon.",
    options: [{
        name: "id",
        description: "The ID or latest pokémon you want to select.",
        required: true,
        type: 3,
        min_length: 1
    }],
    aliases: []
}