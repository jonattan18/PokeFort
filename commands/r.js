const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // For utils

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 2) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to use trade.`); }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            if (channel.AcceptPrompt == undefined) { message.channel.send('There is no trade offer started.'); return; }
            if ((Date.now() - channel.Trade.Timestamp) / 1000 > 120) { message.channel.send('Trade time expired.'); return; }
            if (channel.AcceptPrompt == "Trade" && channel.Trade.Accepted == true && (channel.Trade.User1ID == message.author.id || channel.Trade.User2ID == message.author.id)) {
                if (args[0].toLowerCase() == "add") return add(bot, message, args.splice(1), pokemons, channel, user);
                else if (args[0].toLowerCase() == "remove") return remove(bot, message, args.splice(1), pokemons, channel, user);
            }
            else {
                message.channel.send('You are not in any trade offer.');
                return;
            }

        });
    });
}

// Function to add redeems to trade.
function add(bot, message, args, pokemons, channel_data, user_data) {
    var current_user = 0;
    if (message.author.id == channel_data.Trade.User1ID) {
        current_user = 1;
        var old_credit = channel_data.Trade.Redeems.User1 == undefined ? 0 : channel_data.Trade.Redeems.User1;
    } else {
        current_user = 2;
        var old_credit = channel_data.Trade.Redeems.User2 == undefined ? 0 : channel_data.Trade.Redeems.User2;
    }

    if (!isInt(args[0])) { return message.channel.send('Invalid Syntax!'); }
    var amount = parseInt(args[0]);
    if (amount < 1) { return message.channel.send('Invalid Amount!'); }

    var new_credit = old_credit + amount;

    if (new_credit > user_data.Redeems || user_data.Redeems == undefined || user_data.Redeems == NaN) { return message.channel.send('You do not have enough Redeems!'); }

    if (current_user == 1) {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.Redeems.User1": new_credit } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    } else {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.Redeems.User2": new_credit } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    }

    message.channel.messages.fetch(channel_data.Trade.MessageID).then(message_old => {
        var new_embed = message_old.embeds[0];
        if (current_user == 1) {
            var msg = get_message(current_user, channel_data, new_embed.fields[0].value, new_credit);
            new_embed.fields[0].value = '```' + msg + '```';
        } else {
            var msg = get_message(current_user, channel_data, new_embed.fields[1].value, new_credit);
            new_embed.fields[1].value = '```' + msg + '```';
        }
        message_old.edit(new_embed);
    }).catch(console.error);

}

// Function to remove redeems from trade.
function remove(bot, message, args, pokemons, channel_data, user_data) {
    var current_user = 0;
    if (message.author.id == channel_data.Trade.User1ID) {
        current_user = 1;
        var old_credit = channel_data.Trade.Redeems.User1 == undefined ? 0 : channel_data.Trade.Redeems.User1;
    } else {
        current_user = 2;
        var old_credit = channel_data.Trade.Redeems.User2 == undefined ? 0 : channel_data.Trade.Redeems.User2;
    }

    if (!isInt(args[0])) { return message.channel.send('Invalid Syntax!'); }
    var amount = parseInt(args[0]);
    if (amount < 1) { return message.channel.send('Invalid Amount!'); }

    var new_credit = old_credit - amount;

    if (new_credit < 0) { return message.channel.send('Invalid amount to remove!'); }

    if (current_user == 1) {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.Redeems.User1": new_credit } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    } else {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.Redeems.User2": new_credit } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    }

    message.channel.messages.fetch(channel_data.Trade.MessageID).then(message_old => {
        var new_embed = message_old.embeds[0];
        if (current_user == 1) {
            var msg = get_message(current_user, channel_data, new_embed.fields[0].value, new_credit);
            new_embed.fields[0].value = '```' + msg + '```';
        } else {
            var msg = get_message(current_user, channel_data, new_embed.fields[1].value, new_credit);
            new_embed.fields[1].value = '```' + msg + '```';
        }
        message_old.edit(new_embed);
    }).catch(console.error);

}

// Function to create message trade and add new elements.
function get_message(current_user, channel_data, embed_field, new_credit) {

    embed_field = embed_field.replace(/```/g, '');
    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Credits") == -1;
    }).join('\n').replace(/```/g, '');

    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Redeems") == -1;
    }).join('\n').replace(/```/g, '');

    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Shards") == -1;
    }).join('\n').replace(/```/g, '');

    var extra_msg = "";
    if (current_user == 1) {
        var credits = channel_data.Trade.Credits.User1 == undefined ? 0 : channel_data.Trade.Credits.User1;
        var shards = channel_data.Trade.Shards.User1 == undefined ? 0 : channel_data.Trade.Shards.User1;
        var line_counter = embed_field.split(/\r\n|\r|\n/).length
        if (credits > 0) { extra_msg += `${line_counter} | ${credits} Credits\n`; line_counter++; }
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Redeems\n`; line_counter++; }
        if (shards > 0) { extra_msg += `${line_counter} | ${shards} Shards\n`; line_counter++; }
    }
    if (current_user == 2) {
        var credits = channel_data.Trade.Credits.User2 == undefined ? 0 : channel_data.Trade.Credits.User2;
        var shards = channel_data.Trade.Shards.User2 == undefined ? 0 : channel_data.Trade.Shards.User2;
        var line_counter = embed_field.split(/\r\n|\r|\n/).length;
        if (credits > 0) { extra_msg += `${line_counter} | ${credits} Credits\n`; line_counter++; }
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Redeems\n`; line_counter++; }
        if (shards > 0) { extra_msg += `${line_counter} | ${shards} Shards\n`; line_counter++; }
    }

    return embed_field + extra_msg;
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "r",
    aliases: []
}