module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    interaction.reply({ content: `Challenges are not available yet!` });
}

module.exports.config = {
    name: "challenges",
    description: "Challenges are not available yet!",
    aliases: []
}