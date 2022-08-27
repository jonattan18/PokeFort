const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        // This function will be called if the user is already voted.
        function already_voted() {
            var current_time = new Date(user.DailyCooldown);
            current_time.setHours(current_time.getHours() + 12);
            var time_left = new Date(current_time.getTime() - Date.now());
            var time_left_string = time_left.getUTCHours().toString().padStart(2, "0") + ":" + time_left.getUTCMinutes().toString().padStart(2, "0") + ":" + time_left.getUTCSeconds().toString().padStart(2, "0");
            interaction.reply({ content: `You have already voted in the past 12 hours. Please wait for ${time_left_string} to vote again.` })
        }

        // This function will be called if user is going to vote and rewards will be given.
        function set_vote() {
            var credits_reward_array = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
            var reward_credits = credits_reward_array[Math.floor(Math.random() * credits_reward_array.length)];
            var reward_wishing_pieces = Math.floor(Math.random() * (999 - 1)) + 1 > 995 ? 2 : 1;
            var daily_streak = user.DailyStreak + 1 || 1;
            user.DailyStreak = daily_streak;
            user.PokeCredits = user.PokeCredits ? user.PokeCredits + reward_credits : reward_credits;
            user.WishingPieces = user.WishingPieces ? user.WishingPieces + reward_wishing_pieces : reward_wishing_pieces;
            user.DailyCooldown = Date.now();
            user.save().then(() => {
                var embed = new Discord.EmbedBuilder();
                embed.setTitle("Thank you for voting!");
                embed.setDescription(`You were given ${reward_credits} credits and ${reward_wishing_pieces} wishing pieces!\nYou have daily streak of ${daily_streak}`);
                embed.setFooter({ text: "You can vote again after 12 hours!" });
                interaction.reply({ embeds: [embed] });
            });
        }

        if (user.DailyCooldown) {
            var current_time = new Date(user.DailyCooldown);
            current_time.setHours(current_time.getHours() + 12);
            if ((current_time.getTime() - Date.now()) < 0) return set_vote();
            else return already_voted();
        } else return set_vote();
    });
}

module.exports.config = {
    name: "vote",
    description: "Vote to get rewards.",
    aliases: []
}