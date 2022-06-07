// Models
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) console.log(err);
        if (!prompt) return message.channel.send("You don't have any prompt to deny.")

        var userid = message.author.id;

        //Deny trade.
        if (prompt.PromptType == "Trade" && prompt.UserID.User1ID == userid && prompt.Trade.Accepted == false) {
            message.channel.send(`You took back your trade offer!`);
            return prompt.remove();
        }

        //Check if user is already trading.
        else if (prompt.PromptType == "Trade" && prompt.UserID.User2ID == userid && prompt.Trade.Accepted == false) {
            message.channel.send(`You declined the trade offer!`);
            return prompt.remove();
        }

        //Check if any other traders are in the channel.
        else if (prompt.PromptType == "Trade" && (prompt.UserID.User1ID == userid || prompt.UserID.User2ID == userid) && prompt.Trade.Accepted == true) {
            message.channel.send(`You cancelled ongoing trade!`);
            return prompt.remove();
        }

        // Deny duel.
        else if (prompt.PromptType == "Duel" && prompt.UserID.User1ID == userid && prompt.Duel.Accepted == false) {
            message.channel.send(`You took back your duel offer!`);
            return prompt.remove();
        }

        //Check if user is already dueling.
        else if (prompt.PromptType == "Duel" && prompt.UserID.User2ID == userid && prompt.Duel.Accepted == false) {
            message.channel.send(`You declined the duel offer!`);
            return prompt.remove();
        }

        //Check if any other duelers are in the channel.
        else if (prompt.PromptType == "Duel" && (prompt.UserID.User1ID == userid || prompt.UserID.User2ID == userid) && prompt.Duel.Accepted == true) {
            message.channel.send(`You cancelled ongoing duel!`);
            return prompt.remove();
        }
    });
}

module.exports.config = {
    name: "deny",
    aliases: []
}