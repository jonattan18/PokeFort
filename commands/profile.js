const user_model = require('../models/user');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length != 0) { return message.channel.send("Invalid Command!") }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) { console.log(err); return; }
        if (user) {

            var balance = user.PokeCredits.toLocaleString();
            var timestamp = new Date(user.Joined);
            var date_started = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
            var redeems = user.Redeems == undefined ? 0 : user.Redeems;
            var wishing_pieces = user.WishingPieces == undefined ? 0 : user.WishingPieces;
            var total_pokemons_catched = user.Pokemons.length + user.Released.length + user.Recycled.length
            var total_pokemons_shiny = user.Pokemons.filter(pokemon => pokemon.Shiny).length + user.Released.filter(pokemon => pokemon.Shiny).length + user.Recycled.filter(pokemon => pokemon.Shiny).length
            var total_pokemons = user.Pokemons.length;
            var raids_completed = user.RaidsCompleted == undefined ? 0 : user.RaidsCompleted;
            var daily_streak = user.DailyStreak == undefined ? 0 : user.DailyStreak;

            // Create embed for user profile
            const embed = new Discord.MessageEmbed()
            embed.setTitle(`${message.author.username}'s Profile`)
            embed.setColor(message.member.displayHexColor)
            embed.setThumbnail(message.author.avatarURL())
            embed.setDescription('**Date Started:** ' + date_started
                + '\n**Balance:** ' + balance
                + '\n**Redeems:** ' + redeems
                + '\n**Wishing Pieces:** ' + wishing_pieces
                + '\n**Total Pokémon Caught:** ' + total_pokemons_catched
                + '\n**Total Shiny Pokémon Caught:** ' + total_pokemons_shiny
                + '\n**Total Pokémon:** ' + total_pokemons
                + '\n**Total Raids Completed:** ' + raids_completed
                + '\n**Daily Streak:** ' + daily_streak)

            message.channel.send(embed);

        }
    });

}


module.exports.config = {
    name: "profile",
    aliases: []
}