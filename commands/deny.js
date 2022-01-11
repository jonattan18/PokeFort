const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    var userid = message.author.id;

    //Get user data.
    user_model.findOne({ UserID: userid }, (err, user) => {
        if (!user) return message.channel.send(`You are ineligible for trade!`);
        if (err) console.log(err);

        channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
            if (err) console.log(err);
            if (!channel) return;

            //Deny trade.
            if ((channel.Trade.User2ID == userid) && channel.Trade.Accepted != true) {
                message.channel.send(`You declined the trade offer!`);
                return cancel_trade();
            }

            //Check if user is already trading.
            else if ((channel.Trade.User1ID == userid) && channel.Trade.Accepted != true) {
                message.channel.send(`You declined your own trade offer!`);
                return cancel_trade();
            }

            //Check if any other traders are in the channel.
            else if ((channel.Trade.User1ID == userid || channel.Trade.User2ID == userid) && channel.Accepted == true && ((Date.now() - channel.Timestamp) / 1000 < 120)) {
                message.channel.send(`You cancelled ongoing trade!`);
                return cancel_trade();
            }

            else { message.channel.send(`You are not trading with anyone!`); return; }

            function cancel_trade() {

                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "AcceptPrompt": "", "Trade": new Object } }, (err, channel) => {
                    if (err) return console.log(err);
                    if (!channel) return;
                });
            }
        });
    });
}

module.exports.config = {
    name: "deny",
    aliases: []
}