const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read files.

// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var original_move_name = interaction.options.get("move").value;
    var search_name = interaction.options.get("move").value.replace(/[^a-zA-Z]/g, "").toLowerCase();

    var key_move_info = moveinfo[search_name];

    if (key_move_info != undefined) {
        var name = key_move_info["name"];
        if (key_move_info["accuracy"] == true) var accuracy = "-"
        else var accuracy = key_move_info["accuracy"];

        var description = "";
        var footer = "";
        if (key_move_info["tm"] == undefined) {
            description = key_move_info["desc"] + '\n'
                + "\n" + "**Type:** " + key_move_info["type"]
                + "\n" + "**Power:** " + key_move_info["basePower"]
                + "\n" + "**Accuracy:** " + accuracy
                + "\n" + "**Category:** " + key_move_info["category"]
                + "\n" + "**Priority:** " + key_move_info["priority"]
            footer = "All status effects only work in raids and not duels.";
        }
        else {
            description = key_move_info["desc"] + '\n'
                + "\n" + "**Type:** " + key_move_info["type"]
                + "\n" + "**Power:** " + key_move_info["basePower"]
                + "\n" + "**Accuracy:** " + accuracy
                + "\n" + "**Category:** " + key_move_info["category"]
                + "\n" + "**Priority:** " + key_move_info["priority"]
            footer = `TM NUMBER: TM${key_move_info["tm"].toLocaleString(undefined, { minimumIntegerDigits: 3, useGrouping: false })} | All status effect only work in raids and not duels.`;
        }

        // Create discord embed.
        var embed = new Discord.EmbedBuilder()
        embed.setColor(interaction.member.displayHexColor)
        embed.setTitle(name)
        embed.setDescription(description)
        embed.setFooter({ text: footer })
        interaction.reply({ embeds: [embed] });
    }
    else return interaction.reply({ content: 'No move found with the name ``' + original_move_name + '``!', ephemeral: true });
}

module.exports.config = {
    name: "moveinfo",
    description: "Information on a move.",
    options: [{
        name: "move",
        description: "The move you want to know about.",
        required: true,
        type: 3,
        min_length: 1
    }],
    aliases: []
}