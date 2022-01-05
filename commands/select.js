const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length == 0) {
        message.channel.send("You have not mentioned any pokemon number. Use ``" + prefix + "select <pokemon number>`` or ``l`` for latest pokemon.");
        return;
    }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;
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

        user.Selected = selected_pokemon._id;
        user.save();
        message.channel.send(`You have selected your level ${selected_pokemon.Level} ${selected_pokemon.Nickname}!`);
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
    aliases: []
}