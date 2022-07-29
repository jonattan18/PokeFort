const channel_model = require('../../models/channel');
const user_model = require('../../models/user');


module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.AdminServer != message.guild.id) return; // Admin channel check
    if (!message.isadmin) return; // Admin check

    if (args.length > 0) return message.channel.send('Wrong Syntax!');

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.Admin < 2) return;
        channel_model.findOne({ ChannelID: message.channel.id }, (err, channel_data) => {
            if (channel_data.PokemonID == 0) { message.channel.send("No pokémon currently seen on wild."); return; }
            let pokemon = pokemons.filter(it => it["Pokemon Id"] === channel_data.PokemonID.toString());
            pokemon_name = pokemon[0]["Pokemon Name"];
            message.channel.send(`The name of the pokémon is ${pokemon_name}`);
        });
    });
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "ahint",
    aliases: []
}