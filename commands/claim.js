const beta_model = require('../models/beta');
const user_model = require('../models/user');
const Discord = require('discord.js');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `In order to claim beta rewards, you have to start your journey first.`, ephemeral: true });

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

}

module.exports.config = {
    name: "claim",
    description: "Claim your beta rewards",
    aliases: []
}