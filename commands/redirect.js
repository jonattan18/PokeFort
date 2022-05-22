const guildModel = require("../models/guild")

module.exports.run = async (bot, message, args) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.channel.send("You are not allowed to change the bot's redirect channel!");
    }

    if (args.length < 1) return message.channel.send('Invalid command!');
    if (args.length > 1) return message.channel.send('Invalid command!');

    if (args[0].toLowerCase() == 'disable') {
        guildModel.findOne({ GuildID: message.guild.id }, function (err, guild) {
            if (err) { console.log(err) }
            guild.Redirect = undefined;
            guild.save().then(() => {
                message.channel.send(`Spawn channels are removed!`);
            }).catch(err => {
                console.log(err);
            });
        });
    }
    else if (args[0].substring(0, 2) == '<#') {
        // Remove first two letters and last one letter from a string
        var channelID = args[0].substring(2, args[0].length - 1);
        guildModel.findOneAndUpdate({ GuildID: message.guild.id }, { Redirect: channelID }, function (err, guild) {
            if (err) { return console.log(err) }
            message.channel.send(`Spawn channel set to ${args[0]}`);
        });
    }
    else {
        message.channel.send('Invalid command!');
    }

}

module.exports.config = {
    name: "redirect",
    aliases: []
}
