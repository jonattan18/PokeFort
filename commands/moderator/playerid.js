module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (message.isadmin) message.author = message.mentions.users.first() || message.author; // Admin check
    message.channel.send('UserID: ' + message.author.id);
}

module.exports.config = {
    name: "playerid",
    aliases: []
}