const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    /*
    // Admin
    if (message.isadmin && message.AdminServer == message.guild.id) {
        var user_id = message.author.id;
        user_id = args[0];
        // Fetch given user's avatar, username
        bot.users.fetch(user_id).then(user => {
            args.shift();
            message.author = user;
            return call_balance();
        }).catch(err => {
            return call_balance();
        });
    } else return call_balance();

    function call_balance() {*/

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (user) {
            var balance = user.PokeCredits.toLocaleString();
            var username = interaction.user.username;
            let embed = new Discord.EmbedBuilder();
            embed.setTitle(`${username}'s balance:`);
            embed.setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emoji-one/98/money-bag_1f4b0.png')
            embed.setDescription(`You currently have ${balance} credits.`)
            embed.setColor(interaction.member ? interaction.member.displayHexColor : '#000000');
            interaction.reply({ embeds: [embed] });
        }
    });

    //   }
}

module.exports.config = {
    name: "balance",
    description: "Shows your balance.",
    aliases: []
}