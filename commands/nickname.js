// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    var nickname = args.join(" ");
    if (nickname.length > config.NICKNAME_LENGTH) { message.channel.send("Nickname is too long. Max length is " + config.NICKNAME_LENGTH + " characters."); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var _id = user.Selected; // Get selected ID.
        if (args.length == 0) nickname = undefined;
        else nickname = nickname;

        pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Nickname": nickname } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
            if (err) return console.log(err);
            if (args.length == 0) message.channel.send(`Pokemon nickname has been removed.`);
            else message.channel.send(`Set your current pokémon's nickname to ${nickname}!`);
        });
    });
}

module.exports.config = {
    name: "nickname",
    aliases: []
}