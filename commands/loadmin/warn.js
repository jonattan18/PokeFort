const warning_model = require('../../models/warnings');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 2) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        var reason = args[1];

        let new_warning = new warning_model({
            UserID: mentioned_user.id,
            Reason: reason
        });

        new_warning.save().then(() => {
            message.channel.send(`<@${mentioned_user.id}>! You have been warned by admin. Reason: ${reason}`);
        });
    } else return;
}

module.exports.config = {
    name: "warn",
    aliases: []
}