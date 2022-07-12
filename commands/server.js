module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    message.channel.send("System Declined User Command. [Reason: OS is under construction]");
}

module.exports.config = {
    name: "server",
    aliases: []
}