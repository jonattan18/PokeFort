const Discord = require('discord.js'); // For message embed.
const leaderboard_model = require('../models/leaderboard.js');
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length == 0) {

        //Create an embed
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Weekly Leaderboard");
        embed.setColor(message.guild.me.displayHexColor);

        // Add first 20 rank to embed fields.
        leaderboard_model.findOne({ Type: "Weekly" }, (err, leaderboard) => {
            if (err) return message.channel.send("Looks like not many of you caught many pokemons to display. Please try again later.");
            if (!leaderboard) return message.channel.send("Looks like not many of you caught many pokemons to display. Please try again later.");
            
            var current_week_monday = new Date();
            var days = ((current_week_monday.getDay() + 7) - 1) % 7;
            current_week_monday.setDate(current_week_monday.getDate() - days);
            if (new Date(leaderboard.Timestamp).getTime() < current_week_monday.getTime()) {
                leaderboard.Timestamp = current_week_monday;
                leaderboard.Users = [];
            }

            if (leaderboard.Users.length == 0) return message.channel.send("Looks like not many of you caught many pokemons to display. Please try again later.");
            var upcoming_week = getNextDayOfTheWeek("Monday", true);
            var upcoming_week_difference = new Date(upcoming_week.getTime() - new Date().getTime());

            // Convert weeks to days, hours and minutes.
            var days = Math.floor(upcoming_week_difference / (1000 * 60 * 60 * 24) % 7);
            var hours = Math.floor(upcoming_week_difference / (1000 * 60 * 60) % 24);
            var minutes = Math.floor(upcoming_week_difference / (1000 * 60) % 60);

            // Convert days, hours and minutes to a string.
            var time_string = `${days > 0 ? `${days} days,` : ""} ${hours > 0 ? `${hours} hours,` : ""} ${minutes > 0 ? `${minutes} minutes` : ""}`;

            // Find the user in the leaderboard with the same UserID.
            var user_rank = leaderboard.Users.findIndex(user => user.UserID == message.author.id);
            if (user_rank == -1) {
                embed.setDescription("The weekly leaderboard resets in: " + time_string + "\nYou are not in the leaderboard.");
            }
            else {
                var user_leaderboard = leaderboard.Users[user_rank];
                var no_of_caught = user_leaderboard.NoOfCaught;
                var rank = user_rank + 1;
                embed.setDescription("The weekly leaderboard resets in: " + time_string + "\nYou have caught " + no_of_caught.toLocaleString() + " pokemons this week, you are rank " + rank + "!");
            }

            for (var i = 0; i < 20; i++) {
                if (leaderboard.Users[i] == undefined) break;
                else {
                    var username = leaderboard.Users[i].Username;
                    var no_of_caught = leaderboard.Users[i].NoOfCaught;
                    var rank = leaderboard.Users.indexOf(leaderboard.Users[i]) + 1;
                    embed.addField(`${rank}) ${username}`, `${no_of_caught} pokémon caught`, true);
                }
            }
            message.channel.send(embed);
        });
    }
    else if (args.length == 1 && args[0] == "--hide") {
        user_model.findOne({ UserID: message.author.id }).then(user => {
            if (user.HideWeeklyLeaderboard) {
                message.channel.send("You are already hiding your username.");
            }
            else {
                user.HideWeeklyLeaderboard = true;
                user.save().then(() => {
                    leaderboard_model.findOneAndUpdate({ 'Users.UserID': message.author.id }, { $set: { "Users.$[elem].Username": "???" } }, { arrayFilters: [{ 'elem.UserID': message.author.id }] }, (err, leaderboard) => {
                        message.channel.send("You are now hiding your username.");
                    });
                });
            }
        });
    }
    else if (args.length == 1 && args[0] == "--show") {
        user_model.findOne({ UserID: message.author.id }).then(user => {
            if (!user.HideWeeklyLeaderboard) {
                message.channel.send("You are already showing your username.");
            }
            else {
                user.HideWeeklyLeaderboard = false;
                user.save().then(() => {
                    leaderboard_model.findOneAndUpdate({ 'Users.UserID': message.author.id }, { $set: { "Users.$[elem].Username": message.author.username } }, { arrayFilters: [{ 'elem.UserID': message.author.id }] }, (err, leaderboard) => {
                        message.channel.send("You are now showing your username.");
                    });
                });
            }
        });
    }
    else return message.channel.send("Invalid argument.");
}

// Get the upcoming week.
function getNextDayOfTheWeek(dayName, excludeToday = true, refDate = new Date()) {
    const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        .indexOf(dayName.slice(0, 3).toLowerCase());
    if (dayOfWeek < 0) return;
    refDate.setHours(0, 0, 0, 0);
    refDate.setDate(refDate.getDate() + +!!excludeToday +
        (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
    return refDate;
}

module.exports.config = {
    name: "leaderboard",
    aliases: []
}