// Models
const channel_model = require('../models/channel');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    let channel_data = await channel_model.findOne({ ChannelID: interaction.channel.id });
    if (channel_data.PokemonID == 0) return interaction.reply({ content: "No pokémon currently seen on wild.", ephemeral: true });
    if ((Date.now() - channel_data.Hint) / 1000 < 60 && channel_data.Hint != 0) return interaction.reply({ content: 'Please wait before requesting another hint.', ephemeral: true });
    var pokemon_name = getPokemons.get_pokemon_name_from_id(channel_data.PokemonID, pokemons, false).split('');
    for (i = 0; i < pokemon_name.length; i++) {
        if (getRandomInt(0, 10) > 6) { continue; }
        pokemon_name[i] = "_";
    }

    // Updating pokemon to database.
    channel_model.findOneAndUpdate({ ChannelID: interaction.channel.id }, { Hint: Date.now() }, function (err, user) {
        if (err) { console.log(err) }
    });

    if (pokemon_name.join("").replace(/_/g, '').length == 0) return interaction.reply({ content: "No hint found this time.", ephemeral: true });
    else { return interaction.reply({ content: "The pokémon is ``" + pokemon_name.join('') + "``" }); }
}


// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "hint",
    description: "Gives you a hint on the pokémon you are currently seen.",
    aliases: []
}