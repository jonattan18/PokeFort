const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.channel.send("You are not allowed to change the bot's redirect channel!");
    }

    if (args.length !== 1) return message.channel.send('Invalid command!');

    channel_model.findOne({ ChannelID: message.channel.id }, function (err, channel) {
        if (err) { console.log(err); return; }

        if (args[0].toLowerCase() == 'enable') {
            if (channel.Silence == false) {
                message.channel.send('This channel levelup alerts is already enabled!');
            }
            else {
                channel.Silence = false;
                message.channel.send('This channel levelup alerts is enabled!');
                channel.save();
            }
        }
        else if (args[0].toLowerCase() == 'disable') {
            if (channel.Silence == true) {
                message.channel.send('This channel levelup alerts is already disabled!');
            }
            else {
                channel.Silence = true;
                message.channel.send('This channel levelup alerts is disabled!');
                channel.save();
            }
        }
        else {
            message.channel.send('Invalid command!');
        }
    });

}

module.exports.config = {
    name: "levelup",
    aliases: []
}