module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    if (interaction.options.get("id").value > 6 || interaction.options.get("id").value < 1) return interaction.reply({ content: `Invalid Syntax. Use /help to know how to raid.`, ephemeral: true });

    const commandfile = bot.commands.get("use") || client.commands.get(client.aliases.get("use"));
    if (!commandfile) return interaction.reply({ content: `Invalid Command.`, ephemeral: true });
    return commandfile.run(bot, interaction, user_available, pokemons, true);

}

module.exports.config = {
    name: "switch",
    description: "Switches your current pokémon.",
    options: [{
        name: "id",
        description: "The ID of the pokémon you want to switch to.",
        type: 4,
        required: true,
        min_value: 1,
        max_value: 6
    }],
    aliases: []
}
