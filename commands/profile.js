const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    //if (message.isadmin == true) { interaction.user = message.mentions.users.first() || interaction.user; args.shift() } // Admin check

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) { console.log(err); return; }

        var balance = user.PokeCredits.toLocaleString();
        var timestamp = new Date(user.Joined);
        var date_started = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        var redeems = user.Redeems == undefined ? 0 : user.Redeems;
        var total_pokemons_catched = user.TotalCaught == undefined ? 0 : user.TotalCaught;
        var total_pokemons_shiny = user.TotalShiny == undefined ? 0 : user.TotalShiny;
        var daily_streak = user.DailyStreak == undefined ? 0 : user.DailyStreak;
        var badges = user.Badges.length == 0 ? "None" : user.Badges.join(', ');
        var shards = user.Shards == undefined ? 0 : user.Shards;
        var wishing_pieces = user.WishingPieces == undefined ? 0 : user.WishingPieces;

        getPokemons.getallpokemon(interaction.user.id).then(result => {
            var total_pokemons = result.length;

            // Create embed for user profile
            const embed = new Discord.EmbedBuilder()
            embed.setTitle(`${interaction.user.username}'s Profile`)
            embed.setColor(interaction.member.displayHexColor)
            embed.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            embed.setDescription('**Date Started:** ' + date_started
                + '\n**Balance:** ' + balance
                + '\n**Redeems:** ' + redeems
                + '\n**Shards:** ' + shards
                + '\n**Wishing Pieces:** ' + wishing_pieces
                + '\n**Total Pokémon Caught:** ' + total_pokemons_catched
                + '\n**Total Shiny Pokémon Caught:** ' + total_pokemons_shiny
                + '\n**Total Pokémon:** ' + total_pokemons
                + '\n**Daily Streak:** ' + daily_streak
                + '\n**Badge:** ' + badges)

            interaction.reply({ embeds: [embed] });
        });
    });

}


module.exports.config = {
    name: "profile",
    description: "Gives you a profile of your account.",
    aliases: []
}