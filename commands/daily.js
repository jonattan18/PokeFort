
module.exports.run = async (bot, interaction, user_available, pokemons) => {
    return interaction.reply({ content: "System Declined User Command. [Reason: You can vote in official release]", ephemeral: true });
}

module.exports.config = {
    name: "daily",
    description: "Gives you a daily reward.",
    aliases: []
}