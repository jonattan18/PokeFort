const reports_model = require('../../models/reports');
const user_model = require('../../models/user');
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.AdminServer != message.guild.id) return; // Admin channel check
    if (!message.isadmin) return; // Admin check
    if (args.length == 0) return message.channel.send(`You should specify a user!`);
    if (args.length != 2) return message.channel.send(`You should specify ID of the report to remove!`);
    if (!isInt(args[1])) return message.channel.send(`You should specify ID of the report to remove!`);
    var user_id = args[0];
    // Fetch given user's avatar, username
    bot.users.fetch(user_id).then(user_data => {
        reports_model.find({ UserID: user_id }, (err, reports) => {
            if (err) console.log(err);
            if (reports.length == 0) return message.channel.send(`${user_data.tag} don't have any reports.`);
            if (reports[args[1] - 1] == undefined) return message.channel.send(`${user_data.tag} don't have that report.`);
            reports[args[1] - 1].remove().then(() => {
                message.channel.send(`Report ${args[1]} removed from user ${user_data.tag}.`);
            });
        });
    }).catch(err => {
        return message.channel.send('We could not find that user.');
    });
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "remreport",
    aliases: []
}