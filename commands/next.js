const Discord = require('discord.js'); // For Embedded Message.

// Models
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        var pagination = channel.Pagination;
        var user_page = pagination.filter(x => x.UserID == message.author.id)[0];
        if (!user_page) { message.channel.send(`No messages found to move to next page!`); return; }
        var msg = JSON.parse(user_page.Message[0]);
        var embed = user_page.Embed;
        var current_page = user_page.CurrentPage;
        var total_pages = embed.length;
        message.delete();
        if (current_page == total_pages) return message.channel.send(`You are on the last page!`);
        else { current_page++; }
        const new_embed = new Discord.MessageEmbed(embed[current_page - 1]);
        message.channel.messages.fetch(msg.id)
            .then(message_old => {
                message_old.edit(new_embed);
                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Pagination.$[elem].CurrentPage": current_page } }, { arrayFilters: [{ "elem.UserID": message.author.id }] }, (err, channel) => {
                    if (err) return console.log(err);
                    if (!channel) return;
                });
            })
            .catch(console.error);
    });

}

module.exports.config = {
    name: "next",
    aliases: []
}