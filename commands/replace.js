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

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return message.channel.send("You can't replace pokémon while you are in a duel!");

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return message.channel.send("You can't replace pokémon while you are in a trade!");

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
                        message.channel.send(`Your pokémon have learned ${learn_name}.`)
                    }
                    if (selected_pokemon.Held != "Everstone") selected_pokemon = isevolving(message, selected_pokemon, learn_name);
                    user.MoveReplace = undefined;
                    user.save().then(() => {
                        pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].Moves": selected_pokemon.Moves, "Pokemons.$[elem].TmMoves": selected_pokemon.TmMoves, "Pokemons.$[elem].PokemonId": selected_pokemon.PokemonId } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                            if (err) return console.log(err);
                        });
                    });
                });
            });
        });
    });
}

// Function to evolve by learing moves.
function isevolving(message, selected_pokemon, learn_name) {

    if (selected_pokemon.PokemonId == "142" && learn_name == "Rollout") {
        selected_pokemon.PokemonId = "685";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Lickitung evolved into a Shiny Lickilicky!` : `Your Lickitung evolved into a Lickilicky!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "148" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "687";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Tangela evolved into a Shiny Tangrowth!` : `Your Tangela evolved into a Tangrowth!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "637" && learn_name == "Mimic") {
        selected_pokemon.PokemonId = "218";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Mime Jr. evolved into a Shiny Mr. Mime!` : `Your Mime Jr. evolved into a Mr. Mime!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "636" && learn_name == "Mimic") {
        selected_pokemon.PokemonId = "285";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Bonsly evolved into a Shiny Sudowoodo!` : `Your Bonsly evolved into a Sudowoodo!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "290" && learn_name == "Double Hit") {
        selected_pokemon.PokemonId = "622";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Aipom evolved into a Shiny Ambipom!` : `Your Aipom evolved into a Ambipom!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "293" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "714";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Yanma evolved into a Shiny Yanmega!` : `Your Yanma evolved into a Yanmega!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "345" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "718";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Piloswine evolved into a Shiny Mamoswine!` : `Your Piloswine evolved into a Mamoswine!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "1290" && learn_name == "Stomp") {
        selected_pokemon.PokemonId = "1291";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Steenee evolved into a Shiny Tsareena!` : `Your Steenee evolved into a Tsareena!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "1334" && learn_name == "Dragon Pulse") {
        selected_pokemon.PokemonId = "1335";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Poipole evolved into a Shiny Naganadel!` : `Your Poipole evolved into a Naganadel!`;
        message.channel.send(message_string);
    }
    else if (selected_pokemon.PokemonId == "1511" && learn_name == "Taunt") {
        selected_pokemon.PokemonId = "1512";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Clobbopus evolved into a Shiny Grapploct!` : `Your Clobbopus evolved into a Grapploct!`;
        message.channel.send(message_string);
    }
    else {
        return selected_pokemon;
    }

    return selected_pokemon;
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