const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var streak_count = user.DailyStreak || 0;
        var footer_text = null;
        if (user.DailyCooldown) {
            var current_time = new Date(user.DailyCooldown);
            current_time.setHours(current_time.getHours() + 12);
            if ((current_time.getTime() - Date.now()) < 0) footer_text = "You can vote using /vote command";
            else {
                var time_left = new Date(current_time.getTime() - Date.now());
                var time_left_string = time_left.getUTCHours().toString().padStart(2, "0") + ":" + time_left.getUTCMinutes().toString().padStart(2, "0") + ":" + time_left.getUTCSeconds().toString().padStart(2, "0");
                footer_text = `Time left to be able to daily: ${time_left_string}`;
            }
        } else footer_text = "You can vote using /vote command";

        var embed = new Discord.EmbedBuilder();
        embed.setTitle(`Daily`)
        embed.setColor(interaction.member.displayHexColor)
        embed.setDescription(`Upvote the bot daily to get rewards! Your current vote streak: ${streak_count}`);
        embed.addFields({ name: "Credit Rewards:", value: "50 Credits\n100 Credits\n150 Credits\n200 Credits\n250 Credits\n300 Credits\n400 Credits\n500 Credits\n750 Credits\n1000 Credits", inline: false })
        embed.addFields({ name: "Wishing Piece Rewards:", value: "1 Wishing Piece (Guranteed)\n2 Wishing Pieces", inline: false })
        embed.setFooter({ text: footer_text });
        interaction.reply({ embeds: [embed] });
    });
}

module.exports.config = {
    name: "daily",
    description: "Gives you a daily reward.",
    aliases: []
}