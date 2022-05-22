const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    let channel_data = await channel_model.findOne({ ChannelID: message.channel.id });
    if (channel_data.PokemonID == 0) { message.channel.send("No pokemon currently seen on wild."); return; }
    if ((Date.now() - channel_data.Hint) / 1000 < 60 && channel_data.Hint != 0) { message.react('⏳'); return; }
    let pokemon = pokemons.filter(it => it["Pokemon Id"] === channel_data.PokemonID.toString());
    pokemon_name = pokemon[0]["Pokemon Name"].split('');
    for (i = 0; i < pokemon_name.length; i++) {
        if (getRandomInt(0, 10) > 6) { continue; }
        pokemon_name[i] = "_";
    }

    // Updating pokemon to database.
    channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { Hint: Date.now() }, function (err, user) {
        if (err) { console.log(err) }
    });

    if (pokemon_name.join("").replace(/_/g, '').length == 0) { message.channel.send("No hint found this time.") }
    else { message.channel.send("The pokémon is ``" + pokemon_name.join('') + "``"); }
}


// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "hint",
    aliases: []
}