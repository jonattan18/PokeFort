// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Config
const config = require('../config/config.json');

// Utils
const getPokemons = require('../utils/getPokemon');
const mongoose = require('mongoose');
const { findIndex } = require('lodash');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    var nickname = args.join(" ");
    if (nickname.length > config.NICKNAME_LENGTH) { message.channel.send("Nickname is too long. Max length is " + config.NICKNAME_LENGTH + " characters."); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];

            if (args.length == 0) {
                pokemons_model.findOneAndUpdate({ id: mongoose.ObjectId(selected_pokemon._id) }, (err, pokemon) => {
                });
            }
            else {
                pokemons_model.findOneAndUpdate({ id: mongoose.ObjectId(selected_pokemon._id) }, (err, pokemon) => {
                    var index = findIndex(pokemon.Pokemons, { _id: selected_pokemon._id });
                    console.log(index);
                });
            }
        });
    });
}

module.exports.config = {
    name: "nickname",
    aliases: []
}