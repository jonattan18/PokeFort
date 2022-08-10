const channel_model = require('../models/channel');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
        return interaction.reply({ content: "You are not allowed to change the bot's redirect channel!", ephemeral: true });
    }

    channel_model.findOne({ ChannelID: interaction.channel.id }, function (err, channel) {
        if (err) { console.log(err); return; }

        if (interaction.options.getSubcommand() === "enable") {
            if (channel.Disabled == false) {
                interaction.reply({ content: 'This channel is already enabled!' });
            }
            else {
                channel.Disabled = false;
                interaction.reply({ content: 'This channel is enabled!' });
                channel.save();
            }
        }
        else if (interaction.options.getSubcommand() === "disable") {
            if (channel.Disabled == true) {
                interaction.reply({ content: 'This channel is already disabled!' });
            }
            else {
                channel.Disabled = true;
                interaction.reply({ content: 'This channel is disabled!' });
                channel.save();
            }
        }
        else {
            interaction.reply({ content: 'Invalid command!' });
        }
    });

}

module.exports.config = {
    name: "channel",
    description: "Enable or Disable the channel.",
    options: [{
        name: "enable",
        description: "Enable the channel.",
        type: 1
    }, {
        name: "disable",
        description: "Disable the channel.",
        type: 1
    }],
    aliases: []
}