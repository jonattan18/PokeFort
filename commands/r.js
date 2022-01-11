const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            if (channel.AcceptPrompt == undefined) { message.channel.send('No prompt asked for to use ``accept`` command.'); return; }
            if ((Date.now() - channel.Trade.Timestamp) / 1000 > 120) { message.channel.send('Trade time expired.'); return; }
            if (channel.AcceptPrompt == "Trade" && channel.Trade.User2ID == message.author.id) { trade(bot, message, prefix, channel, user); return; } else { message.channel.send('No prompt asked for to use ``accept`` command.'); return; }

        });
    });
}

// Function to accept and start trade.
function trade(bot, message, prefix, channel, user) {
    var user1id = channel.Trade.User1ID;
    var user2id = channel.Trade.User2ID;

    var user1name = "";
    var user2name = "";

    bot.users.fetch(user1id).then(user_data => {
        user1name = user_data.username;

        bot.users.fetch(user2id).then(user_data => {
            user2name = user_data.username;

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Trade between ${user1name} and ${user2name}`);
            embed.setDescription(`For instructions on how to trade, see ${prefix}help trade.`)
            embed.setColor(message.member.displayHexColor);
            embed.addField(`${user1name}'s is offering`, '``` ```', false);
            embed.addField(`${user2name}'s is offering`, '``` ```', false);
            message.channel.send(embed).then(msg => {
                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "AcceptPrompt": "Trade", "Trade.Accepted": true, "Trade.MessageID": msg.id } }, { upsert: true }, (err, channel) => {
                    if (err) return console.log(err);
                    if (!channel) return;
                });
            });
        });
    });
}

module.exports.config = {
    name: "r",
    aliases: []
}