// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const raid_model = require('../models/raids');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (interaction.options.get('user') == null) return interaction.reply({ content: `No user mentioned to start trade.`, ephemeral: true });
    var user1id = interaction.user.id;
    var user2id = interaction.options.get('user').user.id;
    if (user1id == user2id) return interaction.reply({ content: `You can't trade with yourself!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return interaction.reply({ content: "You can't trade pokémon while you are in a duel!", ephemeral: true });

        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid && raid.CurrentDuel != undefined && raid.CurrentDuel == interaction.user.id) return interaction.reply({ content: "You can't trade pokémon while you are in a raid!", ephemeral: true });
            else {
                //Check if user2 is in the database.
                user_model.findOne({ UserID: user2id }, (err, user2) => {
                    if (!user2) return interaction.reply({ content: `Mentioned user is ineligible for trade!`, ephemeral: true });
                    if (err) return console.log(err);

                    prompt_model.findOne({ $or: [{ "UserID.User1ID": user1id }, { "UserID.User2ID": user1id }] }, (err, prompt1) => {
                        if (err) return console.log(err);
                        if (prompt1 != undefined && prompt1.Trade.Accepted == true) return interaction.reply({ content: `You are already trading with someone!`, ephemeral: true });

                        prompt_model.findOne({ $or: [{ "UserID.User1ID": user2id }, { "UserID.User2ID": user2id }] }, (err, prompt2) => {
                            if (err) return console.log(err);
                            if (prompt2 != undefined && prompt2.Trade.Accepted == true) return interaction.reply({ content: `Mentioned user is already trading with someone!`, ephemeral: true });

                            // Check if any non active prompt found and delete it.
                            prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { $and: [{ $or: [{ "Trade.Accepted": undefined }, { "Trade.Accepted": false }] }, { $or: [{ "Duel.Accepted": undefined }, { "Duel.Accepted": false }] }] }] }, (err, del_prompt) => {
                                if (del_prompt) del_prompt.remove();
                            });

                            var update_data = new prompt_model({
                                ChannelID: interaction.channel.id,
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
                                    interaction.reply({ content: `<@${user2id}>! ${user_data.username} has invited you to trade! Type /accept to start the trade or /deny to deny the trade request.` });
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
    description: "Trade with another user.",
    options: [
        {
            name: "user",
            description: "User to duel with.",
            type: 6,
            required: true
        }],
    aliases: []
}