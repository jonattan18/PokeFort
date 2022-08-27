const Discord = require('discord.js');

// Config file
const config = require("../config/config.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {

    // Create an embed to share invitation link
    const embed = new Discord.EmbedBuilder()
    embed.setTitle("Server Invitation");
    embed.setDescription(`We are inviting you to join our official server!\n\n[Click here to join](${config.OS_INVITE_URL})`)
    interaction.reply({ embeds: [embed] });
}

module.exports.config = {
    name: "server",
    description: "Shows the official server invitation link!",
    aliases: []
}