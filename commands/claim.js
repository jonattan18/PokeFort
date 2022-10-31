const beta_model = require('../models/beta');
const user_model = require('../models/user');
const starter_model = require('../models/starterpack')
const Discord = require('discord.js');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `In order to claim beta rewards, you have to start your journey first.`, ephemeral: true });

    if (interaction.options.getSubcommand() === "beta") {
        beta_model.findOne({ UserID: interaction.user.id }, (err, reward) => {
            if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
            if (!reward) return interaction.reply({ content: `You don't have any beta rewards`, ephemeral: true });

            user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                for (i = 0; i < reward.Mails.length; i++) {
                    user.Mails.push(reward.Mails[i]);
                }
                user.save();
                reward.remove();
                interaction.reply({ content: `We have sent the rewards through your mail, Please claim it.` });
            });

        });
    } else if (interaction.options.getSubcommand() === "raidpack") {
        starter_model.findOne({ UserID: interaction.user.id }, (err, reward) => {
            if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
            if (!reward) return interaction.reply({ content: `You are not eligible for raid start pack`, ephemeral: true });

            user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                for (i = 0; i < reward.Mails.length; i++) {
                    user.Mails.push(reward.Mails[i]);
                }
                user.save();
                reward.remove();
                interaction.reply({ content: `We have sent the pack through your mail, Please claim it.` });
            });

        });
    }

}

module.exports.config = {
    name: "claim",
    description: "Claim your beta rewards",
    options: [{
        name: "beta",
        description: "Beta rewards",
        type: 1
    }, {
        name: "raidpack",
        description: "Raid starter pack",
        type: 1
    }],
    aliases: []
}