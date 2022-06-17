const Discord = require('discord.js'); // Import Discord

module.exports.run = async (bot, message, args, prefix) => {

    // Create embed message
    const embed = new Discord.MessageEmbed()
        .setColor(message.member.displayHexColor)
        .setTitle(`Hello ${message.author.username}!`)
        .setAuthor('Professor Oak', 'https://pbs.twimg.com/profile_images/2927846251/bf8cef29642aceb034d4b01ab29a4ca7_400x400.png')
        .setDescription(`**Welcome to the world of pokémon!**\nTo begin play, choose one of these pokémon with the ${prefix}pick <pokemon> command, like this ${prefix}pick squirtle` +
                        `\n\n**Generation I:**\nBulbasaur | Charmander | Squirtle` +
                        `\n\n**Generation II:**\nChikorita | Cyndaquil| Totodile` +
                        `\n\n**Generation III:**\nTreecko | Torchic | Mudkip` +
                        `\n\n**Generation IV:**\nTurtwig | Chimchar | Piplup` +
                        `\n\n**Generation V:**\nSnivy | Tepig | Oshawott` +
                        `\n\n**Generation VI:**\nChespin | Fennekin | Froakie` +
                        `\n\n**Generation VII:**\nRowlet | Litten | Popplio` +
                        `\n\n**Generation VIII:**\nGrookey | Scorbunny | Sobble`)
        .setFooter("Note: Trading in-game content for IRL money or using a form of automation such as macros or selfbots to gain an unfair advantage will result in a ban from the bot. Don't cheat!")
        .attachFiles('./assets/misc_images/start.png')
        .setImage('attachment://start.png');

    // Send embed message
    message.channel.send(embed);
}

module.exports.config = {
    name: "start",
    aliases: []
}