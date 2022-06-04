
module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    message.channel.send("System Declined User Command. [Reason: You vote in official release]");
}

module.exports.config = {
    name: "vote",
    aliases: []
}