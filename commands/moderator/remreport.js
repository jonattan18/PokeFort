const reports_model = require('../../models/reports');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 2) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        if (!isInt(args[1])) { return; }

        reports_model.find({ UserID: mentioned_user.id }, (err, reports) => {
            if (err) console.log(err);
            if (reports.length == 0) return message.channel.send(`${'``' + mentioned_user.username + '``'} don't have any reports.`);

            reports[args[1] - 1].remove().then(() => {
                message.channel.send(`Report ${args[1]} removed from user ${mentioned_user.username}.`);
            });
        });

    } else return;
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