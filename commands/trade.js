// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const raid_model = require('../models/raids');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    var user1id = message.author.id;
    var user2id = "";
    if (args.length == 0) { message.channel.send(`No user mentioned to start trade.`); return; }
    user2id = args[0].replace(/[<@!>]/g, '');
    if (user1id == user2id) { message.channel.send(`You can't trade with yourself!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return message.channel.send("You can't trade pokémon while you are in a duel!");

        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                if (raid.Started) return message.channel.send("You can't trade pokémon while you are in a raid!");
            }
            else {
                //Check if user2 is in the database.
                user_model.findOne({ UserID: user2id }, (err, user2) => {
                    if (!user2) return message.channel.send(`Mentioned user is ineligible for trade!`);
                    if (err) return console.log(err);

                    prompt_model.findOne({ $or: [{ "UserID.User1ID": user1id }, { "UserID.User2ID": user1id }] }, (err, prompt1) => {
                        if (err) return console.log(err);
                        if (prompt1 != undefined && prompt1.Trade.Accepted == true) return message.channel.send(`You are already trading with someone!`);

                        prompt_model.findOne({ $or: [{ "UserID.User1ID": user2id }, { "UserID.User2ID": user2id }] }, (err, prompt2) => {
                            if (err) return console.log(err);
                            if (prompt2 != undefined && prompt2.Trade.Accepted == true) return message.channel.send(`Mentioned user is already trading with someone!`);

                            // Check if any non active prompt found and delete it.
                            prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { $and: [{ $or: [{ "Trade.Accepted": undefined }, { "Trade.Accepted": false }] }, { $or: [{ "Duel.Accepted": undefined }, { "Duel.Accepted": false }] }] }] }, (err, del_prompt) => {
                                if (del_prompt) del_prompt.remove();
                            });

                            var update_data = new prompt_model({
                                ChannelID: message.channel.id,
                                PromptType: "Trade",
                                UserID: {
                                    User1ID: user1id,
                                    User2ID: user2id
                                },
                                Trade: {
                                    Accepted: false,
                                    User1Items: [],
                                    User2Items: [],
                                    User1IConfirm: false,
                                    User2IConfirm: false
                                }
                            });

                            update_data.save().then(result => {
                                bot.users.fetch(user1id).then(user_data => {
                                    message.channel.send(`<@${user2id}>! ${user_data.username} has invited you to trade! Type ${prefix}accept to start the trade or ${prefix}deny to deny the trade request.`);
                                });
                            });
                        });
                    });
                });
            }
        });
    });
}

module.exports.config = {
    name: "trade",
    aliases: []
}