const user_model = require('../models/user.js');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    if (interaction.options.get("slot") == null) return interaction.reply({ content: `You should specify a slot to edit!`, ephemeral: true });
    if (interaction.options.get("id") == null) return interaction.reply({ content: `You should specify a pokémon to replace the slot!`, ephemeral: true });

    var slot_no = interaction.options.get("slot").value;
    var pokemon_id = interaction.options.get("id").value;

    // Int Check
    if (!isInt(slot_no) || slot_no > 6 || slot_no < 1) {
        return interaction.reply({ content: `That was not a valid slot number!`, ephemeral: true });
    }
    if (!isInt(pokemon_id)) {
        return interaction.reply({ content: `That was not a valid pokémon ID!`, ephemeral: true });
    }

    // Edit Team.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);
        else {
            var selected_team = user.Teams.filter(team => team.Selected == true)[0];
            if (selected_team == undefined) {
                return interaction.reply({ content: `You should select a team first!`, ephemeral: true });
            }
            else {
                // Get Pokemon
                getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
                    var pokemondb = pokemons_from_database[pokemon_id - 1];
                    if (pokemondb == undefined) {
                        return interaction.reply({ content: `_${pokemon_id}_ is not a valid pokémon ID!`, ephemeral: true });
                    }
                    else {
                        if (selected_team.Pokemons.includes(pokemondb._id.toString())) return interaction.reply({ content: `That pokémon already exists in your team!`, ephemeral: true });
                        var index_of_selected = user.Teams.indexOf(selected_team);
                        user.Teams[index_of_selected].Pokemons[slot_no - 1] = pokemondb._id.toString();
                        user.markModified('Teams');
                        user.save().then(() => {
                            interaction.reply({ content: `Pokemon#${slot_no} has been replaced with a level ${pokemondb.Level} ${getPokemons.get_pokemon_name_from_id(pokemondb["PokemonId"], pokemons, pokemondb.Shiny, true)}!` });
                        });
                    }
                });
            }
        }
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
    name: "teamedit",
    description: "Edit your team!",
    options: [{
        name: "slot",
        required: true,
        description: "The slot to edit!",
        type: 4,
        min_value: 1,
        max_value: 6
    },
    {
        name: "id",
        required: true,
        description: "The pokémon ID to replace the slot with!",
        type: 4,
        min_value: 1
    }],
    aliases: []
}