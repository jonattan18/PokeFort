
module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    message.channel.send("System Declined User Command. [Reason: You can't donate anything to PokeFort right now]");
}

module.exports.config = {
    name: "donate",
    aliases: []
}