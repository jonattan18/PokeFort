// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Config
const config = require('../config/config.json');

// Utils
const getPokemons = require('../utils/getPokemon');
const mongoose = require('mongoose');

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
            var _id = selected_pokemon._id;

            if (args.length == 0) {
                pokemons_model.findOne({ id: mongoose.ObjectId(_id) }, (err, pokemon) => {
                    if (err) return console.log(err);
                    var changable_pokemon = pokemon.Pokemons.filter(it => it.id == _id)[0];
                    var index = pokemon.Pokemons.indexOf(changable_pokemon);
                    pokemon.Pokemons[index].Nickname = undefined;
                    pokemon.save();
                    message.channel.send(`Your nickname has been removed.`);
                });
            }
            else {
                pokemons_model.findOne({ id: mongoose.ObjectId(_id) }, (err, pokemon) => {
                    if (err) return console.log(err);
                    var changable_pokemon = pokemon.Pokemons.filter(it => it.id == _id)[0];
                    var index = pokemon.Pokemons.indexOf(changable_pokemon);
                    pokemon.Pokemons[index].Nickname = nickname;
                    pokemon.save();
                    message.channel.send(`Set your current pokémon's nickname to ${nickname}!`);
                });
            }
        });
    });
}

module.exports.config = {
    name: "nickname",
    aliases: []
}