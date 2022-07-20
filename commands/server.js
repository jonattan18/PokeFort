const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {

    // Create an embed to share invitation link
    const embed = new Discord.MessageEmbed()
    embed.setTitle("Server Invitation");
    embed.setDescription("We are inviting you to join our official server!\n\n[Click here to join](https://discord.gg/kHDC5qeJgn)")
    message.channel.send(embed);
}

module.exports.config = {
    name: "server",
    aliases: []
}