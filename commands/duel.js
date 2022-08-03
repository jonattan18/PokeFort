// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const raid_model = require('../models/raids');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var user1id = interaction.user.id;
    var user2id = "";

    if (interaction.options.get('user') == null) return interaction.reply({ content: `No user mentioned to start duel.`, ephemeral: true });
    user2id = interaction.options.get('user').user.id;
    if (user1id == user2id) return interaction.reply({ content: `You can't duel with yourself!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
        if (err) return console.log(err);
        if (_trade) return interaction.reply({ content: `You can't duel pokémon while you are in a trade!`, ephemeral: true });

        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid && raid.CurrentDuel != undefined && raid.CurrentDuel == interaction.user.id) return interaction.reply({ content: `You can't duel while you are in a raid!`, ephemeral: true });
            else {
                //Check if user2 is in the database.
                user_model.findOne({ UserID: user2id }, (err, user2) => {
                    if (!user2) return interaction.reply({ content: `Mentioned user is ineligible for duel!`, ephemeral: true });
                    if (err) return console.log(err);

                    prompt_model.findOne({ $or: [{ "UserID.User1ID": user1id }, { "UserID.User2ID": user1id }] }, (err, prompt1) => {
                        if (err) return console.log(err);
                        if (prompt1 != undefined && prompt1.Duel.Accepted == true) return interaction.reply({ content: `You are already in battle with someone!`, ephemeral: true });

                        prompt_model.findOne({ $or: [{ "UserID.User1ID": user2id }, { "UserID.User2ID": user2id }] }, (err, prompt2) => {
                            if (err) return console.log(err);
                            if (prompt2 != undefined && prompt2.Duel.Accepted == true) return interaction.reply({ content: `Mentioned user is already in battle with someone!`, ephemeral: true });

                            // Check if any non active prompt found and delete it.
                            prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { $and: [{ $or: [{ "Trade.Accepted": undefined }, { "Trade.Accepted": false }] }, { $or: [{ "Duel.Accepted": undefined }, { "Duel.Accepted": false }] }] }] }, (err, del_prompt) => {
                                if (del_prompt) del_prompt.remove();
                            });

                            if (interaction.options.get("tm") != null) var TM_Allowed = true;
                            else var TM_Allowed = false;

                            var update_data = new prompt_model({
                                ChannelID: interaction.channel.id,
                                PromptType: "Duel",
                                UserID: {
                                    User1ID: user1id,
                                    User2ID: user2id
                                },
                                Duel: {
                                    Accepted: false,
                                    User1name: interaction.user.username,
                                    User2name: interaction.options.get("user").user.username,
                                    TM_Allowed: TM_Allowed
                                }
                            });

                            update_data.save().then(result => {
                                bot.users.fetch(user1id).then(user_data => {
                                    interaction.reply({ content: `<@${user2id}>! ${user_data.username} has invited you to duel! Type /accept to start the duel or /deny to deny the duel request.` });
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
    name: "duel",
    description: "Duel with another user.",
    options: [
        {
            name: "user",
            description: "User to duel with.",
            type: 6,
            required: true
        },
        {
            name: "tm",
            description: "Battle with TM moves.",
            type: 3,
            choices: [{
                name: "yes",
                value: "yes",
            }]
        },
    ],
    aliases: []
}