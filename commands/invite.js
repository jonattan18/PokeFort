
module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    message.channel.send("System Declined User Command. [Reason: Invitation only works in Release]");
}

module.exports.config = {
    name: "invite",
    aliases: []
}