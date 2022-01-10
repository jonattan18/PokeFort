const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        

    });
}

module.exports.config = {
    name: "trade",
    aliases: []
}