const channel_model = require('../models/channel');

module.exports.run = async (bot, interaction, args) => {
    if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
        return interaction.reply({ content: "You are not allowed to change the bot's redirect channel!", ephemeral: true });
    }

    if (interaction.options.get("disable") != null && interaction.options.get("channel") == null) {
        channel_model.findOne({ ChannelID: interaction.channel.id }, function (err, channel) {
            if (err) { console.log(err) }
            channel.Redirect = undefined;
            channel.save().then(() => {
                interaction.reply({ content: `Spawn channels are removed!` });
            }).catch(err => {
                console.log(err);
            });
        });
    }
    else if (interaction.options.get("disable") == null && interaction.options.get("channel") != null) {
        if (interaction.options.get("channel").channel.type != 0) return interaction.reply({ content: "This is not a text channel!", ephemeral: true });
        var channelID = interaction.options.get("channel").channel.id;
        channel_model.findOneAndUpdate({ ChannelID: interaction.channel.id }, { Redirect: channelID }, function (err, channel) {
            if (err) { return console.log(err) }
            interaction.reply({ content: `Spawn channel set to <#${channelID}>` });
        });
    }
    else {
        interaction.reply({ content: 'Invalid command!', ephemeral: true });
    }

}

module.exports.config = {
    name: "redirect",
    description: "Sets the channel where the bot will send the spawn messages.",
    options: [{
        name: "disable",
        description: "Disables the redirect channel.",
        type: 3,
        choices: [{
            name: "yes",
            value: "yes"
        }]
    }, {
        name: "channel",
        description: "Sets the channel where the bot will send the spawn messages.",
        type: 7
    }],
    aliases: []
}
