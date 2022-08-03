// Models
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "ChannelID": interaction.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``cancel`` command.', ephemeral: true });

        // If user prompt is for release
        if (prompt.PromptType == "Release") {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You have cancelled pokémon release.' });
            });
        }
        // If user prompt is for recycle
        else if (prompt.PromptType == "Recycle") {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You have cancelled pokémon recycle.' });
            });
        }
        // If user prompt is for trade
        else if (prompt.PromptType == "Trade" && prompt.Trade.Accepted == true) {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You cancelled ongoing trade!' });
            });
        }
        // If user prompt is for duel
        else if (prompt.PromptType == "Duel" && prompt.Duel.Accepted == true) {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You cancelled duel.' });
            });
        }
        // If user prompt is for confirmlist
        else if (prompt.PromptType == "ConfirmList") {
            prompt.remove().then(() => {
                interaction.reply({ content: `You cancelled ${prompt.List.BidTime != undefined ? "auction" : "market"} listing.` });
            });
        }
        // If user prompt is for confirmremove
        else if (prompt.PromptType == "ConfirmRemove") {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You cancelled removing your pokemon.' });
            });
        }
        // If user prompt is for confirmbuy
        else if (prompt.PromptType == "ConfirmBuy") {
            prompt.remove().then(() => {
                interaction.reply({ content: 'You cancelled buying pokémon from market.' });
            });
        }
        else return interaction.reply({ content: 'No prompt asked for to use ``cancel`` command.', ephemeral: true });

    });
}

module.exports.config = {
    name: "cancel",
    description: "Cancel request like trade/duel.",
    aliases: []
}