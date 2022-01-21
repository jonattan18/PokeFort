module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (message.isadmin) message.channel.send('ChannelID: ' + message.channel.id); // Admin check
}

module.exports.config = {
    name: "channelid",
    aliases: []
}