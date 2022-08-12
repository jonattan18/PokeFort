
module.exports.run = async (bot, interaction, user_available, pokemons) => {
    interaction.reply({ content: "System Declined User Command. [Reason: Invitation only works in Release]", ephemeral: true });
}

module.exports.config = {
    name: "invite",
    aliases: []
}