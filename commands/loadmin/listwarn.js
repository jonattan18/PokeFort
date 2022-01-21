const warning_model = require('../../models/warnings');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 1) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;

        warning_model.find({ UserID: mentioned_user.id }, (err, warnings) => {
            if (err) console.log(err);
            if (warnings.length == 0) return message.channel.send(`${'``' + mentioned_user.username + '``'} don't have any warnings.`);

            var warning_list = "";
            for (var i = 0; i < warnings.length; i++) {
                warning_list += `${i + 1}. ${warnings[i].Reason}\n`;
            }

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Warnings for ${mentioned_user.username}`);
            embed.setDescription(warning_list);
            embed.setColor(message.member.displayHexColor);
            message.channel.send(embed);
        });

    } else return;
}

module.exports.config = {
    name: "listwarn",
    aliases: []
}