const channel_model = require('../models/channel');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
        return interaction.reply({ content: "You are not allowed to change the bot's redirect channel!", ephemeral: true });
    }

    channel_model.findOne({ ChannelID: interaction.channel.id }, function (err, channel) {
        if (err) { console.log(err); return; }

        if (interaction.options.getSubcommand() === "enable") {
            if (channel.Silence == false) {
                interaction.reply({ content: 'This channel levelup alerts is already enabled!', ephemeral: true });
            }
            else {
                channel.Silence = false;
                interaction.reply({ content: 'This channel levelup alerts is enabled!' });
                channel.save();
            }
        }
        else if (interaction.options.getSubcommand() === "disable") {
            if (channel.Silence == true) {
                interaction.reply({ content: 'This channel levelup alerts is already disabled!', ephemeral: true });
            }
            else {
                channel.Silence = true;
                interaction.reply({ content: 'This channel levelup alerts is disabled!' });
                channel.save();
            }
        }
        else {
            interaction.reply({ content: 'Invalid command!', ephemeral: true });
        }
    });

}

module.exports.config = {
    name: "levelup",
    description: "Hides level-up message from this channel.",
    description: "Enable or Disable automatic clearing of spawns.",
    options: [{
        name: "enable",
        description: "Enable level-up messages.",
        type: 1
    }, {
        name: "disable",
        description: "Disable level-up messages.",
        type: 1
    }],
    aliases: []
}