const Discord = require('discord.js'); // Import Discord

// Help data
const help_data = require("../config/help.json");

module.exports.run = async (bot, interaction) => {

    var json_data = null;

    // Main page
    if (interaction.options.get("cmd") == null) {
        json_data = help_data.filter(x => x.type == "main_page")[0];
    } else {
        json_data = help_data.filter(x => x.aliases != undefined && x.aliases.includes(interaction.options.get("cmd").value))[0];
    }

    if (json_data == null || json_data == undefined) return interaction.reply({ content: "No help found for that command.", ephemeral: true });

    // Processing data.
    var embed = new Discord.EmbedBuilder();
    embed.setTitle(json_data.title);
    embed.setDescription(json_data.description.join(""));
    embed.setFooter({ text: json_data.footer });

    if (json_data.send_dm == true) {
        interaction.reply({ content: "We have sent the instructions to you. Check your DMs!", ephemeral: true });
        interaction.user.send({ embeds: [embed] });
    } else {
        interaction.reply({ embeds: [embed] });
    }
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "help",
    description: "Help command.",
    options: [{
        name: "cmd",
        description: "Command to get help for.",
        type: 3
    }],
    aliases: []
}