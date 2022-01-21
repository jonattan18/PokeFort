const Discord = require('discord.js');

//Utils
const admin = require('../../utils/admin');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (message.isadmin) {
        var description = admin.gethelp(message.Adminlvl);
        var embed = new Discord.MessageEmbed()
        embed.setTitle(`${admin.getposition(message.Adminlvl)}'s Commands`)
        embed.setDescription(description)
        embed.setColor(message.member.displayHexColor)
        message.channel.send(embed)
    }
}

module.exports.config = {
    name: "ahelp",
    aliases: []
}