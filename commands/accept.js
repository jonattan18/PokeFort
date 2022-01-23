const Discord = require('discord.js'); // For Embedded Message.

// Models
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ "UserID.User2ID": message.author.id }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``accept`` command.');

        prompt_model.findOne({ $and: [{ "UserID.User1ID": prompt.UserID.User1ID }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return message.channel.send('Requested User is already trading with someone!');

            // If user prompt is for trade.
            if (prompt.PromptType == "Trade") {
                if (prompt.UserID.User2ID == message.author.id && prompt.Trade.Accepted == false) {
                    return trade(bot, message, prefix, prompt);
                }
            } else return message.channel.send('No prompt asked for to use ``accept`` command.');

        });
    });
}

// Function to accept and start trade.
function trade(bot, message, prefix, prompt) {
    var user1id = prompt.UserID.User1ID;
    var user2id = prompt.UserID.User2ID;

    var user1name = "";
    var user2name = "";
    var tag1 = "";
    var tag2 = "";

    bot.users.fetch(user1id.toString()).then(user_data => {
        user1name = user_data.username;
        tag1 = user_data.discriminator;

        bot.users.fetch(user2id.toString()).then(user_data => {
            user2name = user_data.username;
            tag2 = user_data.discriminator;

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Trade between ${user1name} and ${user2name}`);
            embed.setDescription(`For instructions on how to trade, see ${prefix}help trade.`)
            embed.setColor(message.member.displayHexColor);
            embed.addField(`${user1name + '#' + tag1}'s is offering`, '``` ```', false);
            embed.addField(`${user2name + '#' + tag2}'s is offering`, '``` ```', false);
            message.channel.send(embed).then(msg => {
                prompt.Trade.Accepted = true;
                prompt.Trade.MessageID = msg.id;
                prompt.save();
            });
        });
    });
}

module.exports.config = {
    name: "accept",
    aliases: []
}