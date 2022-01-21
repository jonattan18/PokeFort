const reports_model = require('../../models/reports');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 1) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;

        reports_model.find({ UserID: mentioned_user.id }, (err, reports) => {
            if (err) return console.log(err);
            if (reports.length == 0) return message.channel.send(`${'``' + mentioned_user.username + '``'} don't have any reports.`);

            var reports_list = "";
            for (var i = 0; i < reports.length; i++) {
                reports_list += `${i + 1}. ${reports[i].Reason}\n`;
            }

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Warnings for ${mentioned_user.username}`);
            embed.setDescription(reports_list);
            embed.setColor(message.member.displayHexColor);
            message.channel.send(embed);
        });

    } else return;
}

module.exports.config = {
    name: "listreport",
    aliases: []
}