
module.exports.run = async (bot, interaction, user_available, pokemons) => {
    interaction.reply({ content: "System Declined User Command. [Reason: You can't donate anything to PokéFort right now]", ephemeral: true });
}

module.exports.config = {
    name: "donate",
    description: "Donate to PokéFort.",
    aliases: []
}