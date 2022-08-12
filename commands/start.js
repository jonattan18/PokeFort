const Discord = require('discord.js'); // Import Discord

module.exports.run = async (bot, interaction, prefix) => {

    // Create embed message
    const embed = new Discord.EmbedBuilder()
        .setColor(interaction.member.displayHexColor)
        .setTitle(`Hello ${interaction.user.username}!`)
        .setAuthor({ name: 'Professor Oak', iconURL: 'https://pbs.twimg.com/profile_images/2927846251/bf8cef29642aceb034d4b01ab29a4ca7_400x400.png' })
        .setDescription(`**Welcome to the world of pokémon!**\nTo begin play, choose one of these pokémon with the /pick <pokemon> command, like this /pick squirtle` +
            `\n\n**Generation I:**\nBulbasaur | Charmander | Squirtle` +
            `\n\n**Generation II:**\nChikorita | Cyndaquil| Totodile` +
            `\n\n**Generation III:**\nTreecko | Torchic | Mudkip` +
            `\n\n**Generation IV:**\nTurtwig | Chimchar | Piplup` +
            `\n\n**Generation V:**\nSnivy | Tepig | Oshawott` +
            `\n\n**Generation VI:**\nChespin | Fennekin | Froakie` +
            `\n\n**Generation VII:**\nRowlet | Litten | Popplio` +
            `\n\n**Generation VIII:**\nGrookey | Scorbunny | Sobble`)
        .setFooter({ text: "Note: Trading in-game content for IRL money or using a form of automation such as macros or selfbots to gain an unfair advantage will result in a ban from the bot. Don't cheat!" })
        .setImage('attachment://start.png');

    // Send embed message
    interaction.reply({ embeds: [embed], files: ['./assets/misc_images/start.png'] });
}

module.exports.config = {
    name: "start",
    description: "Starts your journey!",
    aliases: []
}