const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.isadmin) { message.author = message.mentions.users.first() || message.author; args.shift() } // Admin check

    await user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user) {
            var balance = user.PokeCredits.toLocaleString();
            var username = message.author.username;
            let embed = new Discord.MessageEmbed();
            embed.setTitle(`${username}'s balance:`);
            embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emoji-one/98/money-bag_1f4b0.png')
            embed.setDescription(`You currently have ${balance} credits.`)
            embed.setColor(message.member.displayHexColor);
            message.channel.send(embed);
        }
    });

}

module.exports.config = {
    name: "balance",
    aliases: []
}