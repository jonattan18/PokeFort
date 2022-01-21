module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (message.isadmin) message.channel.send('ServerID: ' + message.guild.id); // Admin check
}

module.exports.config = {
    name: "serverid",
    aliases: []
}