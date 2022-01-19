const Discord = require('discord.js'); // For Embedded Message.

// Models
const pages_model = require('../models/pages');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    pages_model.findOne({ ChannelID: message.channel.id, UserID: message.author.id }, (err, pages) => {
        if (err) return console.log(err);
        if (!pages) { message.channel.send(`No messages found to move to next page!`); return; }

        var embed = pages.Embed;
        var current_page = pages.CurrentPage;
        var total_pages = embed.length;

        message.delete(); // Remove next command sent by user.

        if (current_page == total_pages - 1) return message.channel.send(`You are on the last page!`);
        else { current_page++; }
        const new_embed = new Discord.MessageEmbed(embed[current_page]);
        message.channel.messages.fetch(pages.MessageID)
            .then(message_old => {
                message_old.edit(new_embed);
                pages.CurrentPage = current_page;
                pages.save();
            })
            .catch(console.error);
    });

}

module.exports.config = {
    name: "next",
    aliases: []
}