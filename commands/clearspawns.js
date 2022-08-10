const channel_model = require('../models/channel');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
        return interaction.reply({ content: "You are not allowed to change the bot's redirect channel!", ephemeral: true });
    }

    channel_model.findOne({ ChannelID: interaction.channel.id }, function (err, channel) {
        if (err) { console.log(err); return; }

        if (interaction.options.getSubcommand() === "enable") {
            if (channel.ClearSpawns == true) {
                interaction.reply({ content: 'This channel spawn clearer is already enabled!' });
            }
            else {
                channel.ClearSpawns = true;
                interaction.reply({ content: 'This channel spawn clearer alerts is enabled!' });
                channel.save();
            }
        }
        else if (interaction.options.getSubcommand() === "disable") {
            if (channel.ClearSpawns == false) {
                interaction.reply({ content: 'This channel spawn clearer is already disabled!' });
            }
            else {
                channel.ClearSpawns = false;
                interaction.reply({ content: 'This channel spawn clearer is disabled!' });
                channel.save();
            }
        }
        else {
            interaction.reply({ content: 'Invalid command!', ephemeral: true });
        }
    });

}

module.exports.config = {
    name: "clearspawns",
    description: "Enable or Disable automatic clearing of spawns.",
    options: [{
        name: "enable",
        description: "Enable automatic clearing of spawns.",
        type: 1
    }, {
        name: "disable",
        description: "Disable automatic clearing of spawns.",
        type: 1
    }],
    aliases: []
}