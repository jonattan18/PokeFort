const reports_model = require('../../models/reports');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 2) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        var reason = args[1];

        let new_report = new reports_model({
            UserID: mentioned_user.id,
            Reason: reason
        });

        new_report.save().then(() => {
            message.channel.send(`<@${mentioned_user.id}>! You have been reported to admin by moderator. Reason: ${reason}`);
        });
    } else return;
}

module.exports.config = {
    name: "report",
    aliases: []
}