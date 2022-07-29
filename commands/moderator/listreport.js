const reports_model = require('../../models/reports');
const user_model = require('../../models/user');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.AdminServer != message.guild.id) return; // Admin channel check
    if (!message.isadmin) return; // Admin check
    if (args.length == 0) return message.channel.send(`You should specify a user!`);
    var user_id = args[0];
    // Fetch given user's avatar, username
    bot.users.fetch(user_id).then(user_data => {
        reports_model.find({ UserID: user_id }, (err, reports) => {
            if (err) return console.log(err);
            if (reports.length == 0) return message.channel.send(`${user_data.tag} don't have any reports.`);
            var reports_list = "";
            for (var i = 0; i < reports.length; i++) {
                reports_list += `${i + 1}. ${reports[i].Reason} -> Reported At: ${reports[i].Date.toLocaleUpperCase()}\n`;
            }
            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Warnings for ${user_data.tag}`);
            // embed.setThumbnail(user_data.displayAvatarURL({ dynamic: true }))
            embed.setDescription(reports_list);
            embed.setColor(message.member.displayHexColor);
            message.channel.send(embed);
        });
    }).catch(err => {
        return message.channel.send('We could not find that user.');
    });
}

module.exports.config = {
    name: "listreport",
    aliases: []
}