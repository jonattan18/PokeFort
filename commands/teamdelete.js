const user_model = require('../models/user.js');
const Discord = require('discord.js');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    if (interaction.options.get("id") == null) return interaction.reply({ content: `You should specify a team name!`, ephemeral: true });

    var args = interaction.options.get("id").value.split(" ");
    var deleted_team_name = [];

    // Delete Team.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);

        for (let i = 0; i < args.length; i++) {
            if (user.Teams[args[i] - 1] != undefined) {
                deleted_team_name.push(user.Teams[args[i] - 1].TeamName);
                user.Teams[args[i] - 1] = null;
            } else return interaction.reply({ content: `${args[i]}_ is not a valid team ID!`, ephemeral: true });
        }

        // Remove nulls.
        user.Teams = user.Teams.filter(function (el) {
            return el != null;
        });

        user.save().then(() => {
            if (deleted_team_name.length == 1) interaction.reply({ content: `Team \`${deleted_team_name[0]}\` has been deleted!` });
            else {
                var embed = new Discord.EmbedBuilder();
                embed.setTitle("The following teams has been deleted:");
                var description = "";
                for (let i = 0; i < deleted_team_name.length; i++) {
                    description += `${deleted_team_name[i]}\n`;
                }
                embed.setDescription(description);
                interaction.reply({ embeds: [embed] });
            }
        });
    });

}

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "teamdelete",
    description: "Delete a team.",
    options: [{
        name: "id",
        description: "Id(s) of the team to delete.",
        required: true,
        min_length: 1,
        max_length: 30,
        type: 3,
    }],
    aliases: []
}