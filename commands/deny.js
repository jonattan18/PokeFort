// Models
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "ChannelID": interaction.channel.id }] }, (err, prompt) => {
        if (err) console.log(err);
        if (!prompt) return interaction.reply({ content: "You don't have any prompt to deny.", ephemeral: true });

        var userid = interaction.user.id;

        //Deny trade.
        if (prompt.PromptType == "Trade" && prompt.UserID.User1ID == userid && prompt.Trade.Accepted == false) {
            interaction.reply({ content: `You took back your trade offer!` });
            return prompt.remove();
        }

        //Check if user is already trading.
        else if (prompt.PromptType == "Trade" && prompt.UserID.User2ID == userid && prompt.Trade.Accepted == false) {
            interaction.reply({ content: `You declined the trade offer!` });
            return prompt.remove();
        }

        //Check if any other traders are in the channel.
        else if (prompt.PromptType == "Trade" && (prompt.UserID.User1ID == userid || prompt.UserID.User2ID == userid) && prompt.Trade.Accepted == true) {
            interaction.reply({ content: `You cancelled ongoing trade!` });
            return prompt.remove();
        }

        // Deny duel.
        else if (prompt.PromptType == "Duel" && prompt.UserID.User1ID == userid && prompt.Duel.Accepted == false) {
            interaction.reply({ content: `You took back your duel offer!` });
            return prompt.remove();
        }

        //Check if user is already dueling.
        else if (prompt.PromptType == "Duel" && prompt.UserID.User2ID == userid && prompt.Duel.Accepted == false) {
            interaction.reply({ content: `You declined the duel offer!` });
            return prompt.remove();
        }

        //Check if any other duelers are in the channel.
        else if (prompt.PromptType == "Duel" && (prompt.UserID.User1ID == userid || prompt.UserID.User2ID == userid) && prompt.Duel.Accepted == true) {
            interaction.reply({ content: `You cancelled ongoing duel!` });
            return prompt.remove();
        }
    });
}

module.exports.config = {
    name: "deny",
    description: "Deny a prompt.",
    aliases: []
}