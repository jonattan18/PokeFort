const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if(args.length == 0) { message.channel.send(`You should give a nickname to conitnue.`); return;}

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;
        var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
        var _id = selected_pokemon._id;
        var index = user_pokemons.indexOf(selected_pokemon);
        var nickname = args.join(" ");
        user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons.$[el].Nickname": nickname } }, {
            arrayFilters: [{ "el._id": _id }],
            new: true
        }, (err, user) => {
            if (err) return console.log(err);
            message.channel.send(`Set your current pokémon's nickname to ${nickname}!`);
        });
    });
}

module.exports.config = {
    name: "nickname",
    aliases: []
}