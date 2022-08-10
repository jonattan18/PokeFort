// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (interaction.options.getSubcommand() === "item") {
        //Get user data.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            // Get all user pokemons.
            getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;

                if (selected_pokemon.Held == undefined || selected_pokemon.Held == null || selected_pokemon.Held == "null") return interaction.reply({ content: `You don't have any holding item to remove from your pokemon.`, ephemeral: true });
                else {
                    pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $unset: { "Pokemons.$[elem].Held": 1 } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                        if (err) return console.log(err);
                        interaction.reply({ content: `You have removed ${selected_pokemon.Held} from your pokemon.` });
                    })
                }
            });
        });
    }
}

module.exports.config = {
    name: "drop",
    description: "Drops an item from your pokemon.",
    options: [{
        name: "item",
        description: "The item to drop from your pokemon.",
        type: 1
    }],
    aliases: []
}