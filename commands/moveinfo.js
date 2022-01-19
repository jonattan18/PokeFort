const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read files.

// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { return message.channel.send(`You should specify a move name!`); }

    var original_move_name = args.join(" ");
    var search_name = args.join("").replace(/[^a-zA-Z ]/g, "").toLowerCase();

    var key_move_info = moveinfo[search_name];
    if (key_move_info != undefined) {
        var name = key_move_info["name"];
        if (key_move_info["accuracy"] == true) var accuracy = 100
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
            footer = `TM NUMBER: TM${key_move_info["tm"].toLocaleString(undefined, {minimumIntegerDigits: 3, useGrouping:false})} | All status effect only work in raids and not duels.`;
        }

        // Create discord embed.
        var embed = new Discord.MessageEmbed()
        embed.setColor(message.member.displayHexColor)
        embed.setTitle(name)
        embed.setDescription(description)
        embed.setFooter(footer)
        message.channel.send(embed);
    }
    else { return message.channel.send('No move found with the name ``' + original_move_name + '``!'); }
}

module.exports.config = {
    name: "moveinfo",
    aliases: []
}