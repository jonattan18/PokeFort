const reports_model = require('../../models/reports');
const user_model = require('../../models/user');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.AdminServer != message.guild.id) return; // Admin channel check
    if (!message.isadmin) return; // Admin check

    if (args.length == 0) return message.channel.send(`You should specify a user!`);

    var user_id = args[0];
    args.shift();
    if (args.length == 0) return message.channel.send('Wrong Syntax!');

    // Fetch given user's avatar, username
    bot.users.fetch(user_id).then(user_data => {
        user_model.findOne({ UserID: user_id }, (err, user) => {
            if (err) { console.log(err); return; }
            if (!user) return message.channel.send('That user does not exists in database.')

            var reason = args.join(' ');
            let new_report = new reports_model({
                UserID: user_id,
                Reason: reason,
                Date: new Date().toLocaleString()
            });

            new_report.save().then(() => {
                var embed = new Discord.MessageEmbed()
                embed.setTitle(`Report Activity`)
                embed.setColor(message.member.displayHexColor)
                embed.setThumbnail(user_data.displayAvatarURL({ dynamic: true }))
                embed.setDescription(`You have reported ${user_data.tag} for the following\n\nReason: \`${reason}\``);
                embed.setFooter(`Reported At : ${new Date().toLocaleString().toLocaleUpperCase()}`)
                message.channel.send(embed);
            });
        });
    }).catch(err => {
        return message.channel.send('We could not find that user.');
    });
}

module.exports.config = {
    name: "report",
    aliases: []
}