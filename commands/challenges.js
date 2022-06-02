module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    message.channel.send(`You can only access challenges during final release.`);
}

module.exports.config = {
    name: "challenges",
    aliases: []
}