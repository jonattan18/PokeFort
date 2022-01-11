const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    var user1id = message.author.id;
    var user2id = "";
    if (args.length == 0) { message.channel.send(`No user mentioned to start trade.`); return; }
    if (args.length == 1) { user2id = args[0].substring(args[0].length, 3).slice(0, -1); }
    if (user1id == user2id) { message.channel.send(`You can't trade with yourself!`); return; }

    //Get user data.
    user_model.findOne({ UserID: user1id }, (err, user) => {
        if (!user) return message.channel.send(`You are ineligible for trade!`);
        if (err) console.log(err);

        //Check if user2 is in the database.
        user_model.findOne({ UserID: user2id }, (err, user2) => {
            if (!user2) message.channel.send(`Mentioned user is ineligible for trade!`);
            if (err) console.log(err);

            channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
                if (err) console.log(err);
                if (!channel) return;

                //Check if user1 is already trading.
                if ((channel.Trade.User1ID == user1id || channel.Trade.User2ID == user1id) && channel.Trade.Accepted == true && ((Date.now() - channel.Timestamp) / 1000 > 120)) {
                    message.channel.send(`You are already trading with someone!`);
                    return;
                }

                //Check if user2 is already trading.
                if ((channel.Trade.User1ID == user2id || channel.Trade.User2ID == user2id) && channel.Trade.Accepted == true && ((Date.now() - channel.Timestamp) / 1000 > 120)) {
                    message.channel.send(`Mentioned user is already trading with someone!`);
                    return;
                }

                //Check if any other traders are in the channel.
                if (channel.Accepted == true && ((Date.now() - channel.Timestamp) / 1000 < 120)) {
                    message.channel.send(`There is already a trade going on!`);
                    return;
                }

                var update_data = {
                    User1ID: user1id,
                    User2ID: user2id,
                    Accepted: false,
                    User1Items: [],
                    User2Items: [],
                    User1IConfirm: false,
                    User2IConfirm: false,
                    Timestamp: Date.now()
                }
                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "AcceptPrompt": "Trade", "Trade": update_data } }, (err, channel) => {
                    if (err) return console.log(err);
                    if (!channel) return;
                    bot.users.fetch(user1id).then(user_data => {
                        message.channel.send(`<@${user2id}>! ${user_data.username} has invited you to trade! Type .accept to start the trade or .deny to deny the trade request.`);
                    });
                });
            });
        });
    });
}

module.exports.config = {
    name: "trade",
    aliases: []
}