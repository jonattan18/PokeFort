const warning_model = require('../../models/warnings');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 2) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        if (!isInt(args[1])) { return; }

        warning_model.find({ UserID: mentioned_user.id }, (err, warnings) => {
            if (err) console.log(err);
            if (warnings.length == 0) return message.channel.send(`${'``' + mentioned_user.username + '``'} don't have any warnings.`);

            warnings[args[1] - 1].remove().then(() => {
                message.channel.send(`Warning ${args[1]} removed from user ${mentioned_user.username}.`);
            });
        });

    } else return;
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "remwarn",
    aliases: []
}