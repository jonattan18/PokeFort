const Discord = require('discord.js');

module.exports.run = async (bot, interaction, user_available, pokemons) => {

    // Create an embed to share invitation link
    const embed = new Discord.EmbedBuilder()
    embed.setTitle("Server Invitation");
    embed.setDescription("We are inviting you to join our official server!\n\n[Click here to join](https://discord.gg/kHDC5qeJgn)")
    interaction.reply({ embeds: [embed] });
}

module.exports.config = {
    name: "server",
    description: "Shows the official server invitation link!",
    aliases: []
}