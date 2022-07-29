const Discord = require('discord.js');

// Utils
const admin = require('../../utils/admin');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.AdminServer != message.guild.id) return; // Admin channel check
    if (!message.isadmin) return; // Admin check

    if (args.length > 0) return message.channel.send('Wrong Syntax!');

    var description = admin.gethelp(message.Adminlvl);
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`${admin.getposition(message.Adminlvl)}'s Commands`)
    embed.setDescription(description)
    embed.setColor(message.member.displayHexColor)
    message.channel.send(embed)
}

module.exports.config = {
    name: "ahelp",
    aliases: []
}