module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.isadmin) message.channel.send('ChannelID: ' + message.channel.id); // Admin check
}

module.exports.config = {
    name: "channelid",
    aliases: []
}