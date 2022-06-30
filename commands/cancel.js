// Models
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``cancel`` command.');

        // If user prompt is for release
        if (prompt.PromptType == "Release") {
            prompt.remove().then(() => {
                message.channel.send('You have cancelled pokémon release.');
            });
        }
        // If user prompt is for recycle
        else if (prompt.PromptType == "Recycle") {
            prompt.remove().then(() => {
                message.channel.send('You have cancelled pokémon recycle.');
            });
        }
        // If user prompt is for trade
        else if (prompt.PromptType == "Trade" && prompt.Trade.Accepted == true) {
            prompt.remove().then(() => {
                message.channel.send('You cancelled ongoing trade!');
            });
        }
        // If user prompt is for duel
        else if (prompt.PromptType == "Duel" && prompt.Duel.Accepted == true) {
            prompt.remove().then(() => {
                message.channel.send('You cancelled duel.');
            });
        }
        // If user prompt is for confirmlist
        else if (prompt.PromptType == "ConfirmList") {
            prompt.remove().then(() => {
                message.channel.send(`You cancelled ${prompt.List.BidTime != undefined ? "auction" : "market"} listing.`);
            });
        }
        // If user prompt is for confirmremove
        else if (prompt.PromptType == "ConfirmRemove") {
            prompt.remove().then(() => {
                message.channel.send('You cancelled removing your pokemon.');
            });
        }
        // If user prompt is for confirmbuy
        else if (prompt.PromptType == "ConfirmBuy") {
            prompt.remove().then(() => {
                message.channel.send('You cancelled buying pokémon from market.');
            });
        }
        else return message.channel.send('No prompt asked for to use ``cancel`` command.');

    });
}

module.exports.config = {
    name: "cancel",
    aliases: []
}