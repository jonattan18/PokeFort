const Discord = require('discord.js');

// Config file
const config = require("../config/config.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var invite_url = config.INVITE_URL.replace("[CLIENTID]", bot.user.id);

    // Create an embed to share invitation link
    const embed = new Discord.EmbedBuilder()
    embed.setTitle("Party Invitation? Count me in!");
    embed.setDescription(`[Click here](${invite_url}) to add me in your precious party.\n\n[👉 👈 Wanna join my party?](${config.OS_INVITE_URL})`);
    embed.setColor("#e5ce1d");
    interaction.reply({ embeds: [embed] });
}

module.exports.config = {
    name: "invite",
    description: "Invite me to your server.",
    aliases: []
}