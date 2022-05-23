const Discord = require('discord.js'); // For Embedded Message.

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ "UserID.User1ID": message.author.id }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return message.channel.send("You can't select pokemon while you are in a duel!");

        prompt_model.findOne({ $and: [{ "UserID.User2ID": message.author.id }, { "Duel.Accepted": true }] }, (err, _duel) => {
            if (err) return console.log(err);
            if (_duel) return message.channel.send("You can't select pokemon while you are in a duel!");

            if (args.length > 1 || args.length < 1) return message.channel.send(`You should specify a place to learn!`);
            if (!isInt(args[0])) return message.channel.send(`You should specify a place to learn!`);
            if (args[0] > 4 || args[0] < 1) return message.channel.send(`You should specify a place to learn!`);

            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                if (user.MoveReplace == undefined) return message.channel.send(`You don't have any moves to replace!`);
                getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                    var learn_name = "";
                    var user_pokemons = pokemons_from_database;
                    var selected_pokemon = user_pokemons.filter(it => it._id == user.MoveReplace[0])[0];
                    if (selected_pokemon == undefined || selected_pokemon == null) return message.channel.send(`You don't have any moves to replace!`);
                    selected_pokemon.Moves = selected_pokemon.Moves == undefined ? {} : selected_pokemon.Moves;
                    learn_name = movesparser.movedata(user.MoveReplace[2]).name;
                    if (user.MoveReplace[1] == "TmMove") { learn_name += " (TM)"; selected_pokemon.TmMoves = _.without(selected_pokemon.TmMoves, user.MoveReplace[2]); }
                    if (selected_pokemon.Moves[args[0]]) {
                        message.channel.send(`${selected_pokemon.Moves[args[0]]} is replaced with ${learn_name}.`);
                        selected_pokemon.Moves[args[0]] = learn_name;
                    } else {
                        selected_pokemon.Moves[args[0]] = learn_name;
                        message.channel.send(`Your pokemon have learned ${learn_name}.`)
                    }

                    user.MoveReplace = undefined;
                    user.save().then(() => {
                        pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].Moves": selected_pokemon.Moves, "Pokemons.$[elem].TmMoves": selected_pokemon.TmMoves } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                            if (err) return console.log(err);

                        });
                    });
                });
            });
        });
    });
}


// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}


module.exports.config = {
    name: "replace",
    aliases: []
}