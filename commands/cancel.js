// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            var user_prompt = channel.Prompt;
            if (user_prompt.UserID != message.author.id) { message.channel.send('No prompt asked for to use ``cancel`` command.'); return; }
            if (user_prompt.Reason == "Release") { release(message, prefix, user_prompt); return; }
            if (user_prompt.Reason == "Recycle") { recycle(message, prefix, user_prompt); return; }

        });
    });
}

// Function to release pokemon.
function recycle(message, prefix, user_prompt) {
    var old_date = user_prompt.Timestamp;
    var current_date = Date.now();

    if ((current_date - old_date) / 1000 > 120) {
        message.channel.send('No pokemons are in recycle state to cancel. Please use ``' + prefix + 'recycle`` !');
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);
        });
        return;
    }

    channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
        if (err) console.log(err);
        message.channel.send(`You cancelled the recycle. Pokemon Spared!`);
        return;
    });
}

// Function to release pokemon.
function release(message, prefix, user_prompt) {
    var old_date = user_prompt.Timestamp;
    var current_date = Date.now();

    if ((current_date - old_date) / 1000 > 120) {
        message.channel.send('No pokemons are in release state to cancel. Please use ``' + prefix + 'release`` !');
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);
        });
        return;
    }

    channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
        if (err) console.log(err);
        message.channel.send(`You cancelled the release. Pokemon Spared!`);
        return;
    });
}

module.exports.config = {
    name: "cancel",
    aliases: []
}