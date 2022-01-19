// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    var user1id = message.author.id;
    var user2id = "";
    if (args.length == 0) { message.channel.send(`No user mentioned to start trade.`); return; }
    user2id = args[0].replace(/[<@!>]/g, '');
    if (user1id == user2id) { message.channel.send(`You can't trade with yourself!`); return; }

    //Check if user2 is in the database.
    user_model.findOne({ UserID: user2id }, (err, user2) => {
        if (!user2) message.channel.send(`Mentioned user is ineligible for trade!`);
        if (err) console.log(err);

        prompt_model.findOne({ $or: [{ "UserID.User1ID": user1id }, { "UserID.User2ID": user1id }] }, (err, prompt1) => {
            if (err) console.log(err);
            if (prompt1.Trade.Accepted == true) return message.channel.send(`You are already trading with someone!`);

            prompt_model.findOne({ $or: [{ "UserID.User1ID": user2id }, { "UserID.User2ID": user2id }] }, (err, prompt2) => {
                if (err) console.log(err);
                if (prompt2.Trade.Accepted == true) return message.channel.send(`Mentioned user is already trading with someone!`);

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