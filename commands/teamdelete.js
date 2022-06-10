const user_model = require('../models/user.js');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`You should atleast specifiy one id to delete a team!`); return; }

    // Int Check
    for (let i = 0; i < args.length; i++) {
        if (!isInt(args[i])) {
            return message.channel.send(`_${args[i]}_ is not a valid team ID!`);
        }
    }

    var deleted_team_name = [];

    // Delete Team.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return message.channel.send(`An error occured!`);

        for (let i = 0; i < args.length; i++) {
            if (user.Teams[args[i] - 1] != undefined) {
                deleted_team_name.push(user.Teams[args[i] - 1].TeamName);
                user.Teams[args[i] - 1] = null;
            } else return message.channel.send(`_${args[i]}_ is not a valid team ID!`);
        }

        // Remove nulls.
        user.Teams = user.Teams.filter(function (el) {
            return el != null;
        });

        user.save().then(() => {
            if (deleted_team_name.length == 1) message.channel.send(`Team \`${deleted_team_name[0]}\` has been deleted!`);
            else {
                var embed = new Discord.MessageEmbed();
                embed.setTitle("The following teams has been deleted:");
                var description = "";
                for (let i = 0; i < deleted_team_name.length; i++) {
                    description += `${deleted_team_name[i]}\n`;
                }
                embed.setDescription(description);
                message.channel.send(embed);
            }
        });
    });

}

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "teamdelete",
    aliases: []
}