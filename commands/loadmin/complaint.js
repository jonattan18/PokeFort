const complaint_model = require('../../models/complaints');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 2) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        var reason = args[1];

        let new_complaint = new complaint_model({
            UserID: mentioned_user.id,
            ChannelID: message.channel.id,
            GuildID: message.guild.id,
            Reason: reason
        });

        new_complaint.save().then(() => {
            message.channel.send(`Complaint have registered for ${mentioned_user.username}. Reason: ${reason}`);
        });
    } else return;
}

module.exports.config = {
    name: "complaint",
    aliases: []
}