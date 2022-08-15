const Discord = require('discord.js'); // For Embedded Message.

// Models
const pages_model = require('../models/pages');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    pages_model.findOne({ ChannelID: interaction.channel.id, UserID: interaction.user.id }, (err, pages) => {
        if (err) return console.log(err);
        if (!pages) return interaction.reply({ content: `No messages found to move to next page!`, ephemeral: true });

        var embed = pages.Embed;
        var current_page = pages.CurrentPage;
        var total_pages = embed.length;

        if (current_page == total_pages - 1) return interaction.reply({ content: `You are on the last page!`, ephemeral: true });
        else { current_page++; }
        var embed_data = embed[current_page].data;
        var new_embed = new Discord.EmbedBuilder();
        new_embed.setTitle(embed_data.title);
        new_embed.setDescription(embed_data.description);
        if (embed_data.color != undefined && embed_data.color != null) new_embed.setColor(embed_data.color);
        if (embed_data.footer != undefined && embed_data.footer != null) new_embed.setFooter(embed_data.footer);
        if (embed_data.fields != undefined) new_embed.setFields(embed_data.fields);

        interaction.channel.messages.fetch(pages.MessageID)
            .then(message_old => {
                message_old.edit({ embeds: [new_embed] });
                pages.CurrentPage = current_page;
                pages.save();
            })
            .catch(console.error);
    });

}

module.exports.config = {
    name: "next",
    description: "Moves to the next page of the menu.",
    aliases: []
}