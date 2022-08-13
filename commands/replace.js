const Discord = require('discord.js'); // For Embedded Message.

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');
const prompt_model = require('../models/prompt');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return interaction.reply({ content: "You can't replace pokémon while you are in a duel!", ephemeral: true });

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return interaction.reply({ content: "You can't replace pokémon while you are in a trade!", ephemeral: true });

            var user_requested_replace = interaction.options.get("move").value;

            if (!isInt(user_requested_replace)) return interaction.reply({ content: `You should specify a place to learn!`, ephemeral: true });
            if (user_requested_replace > 4 || user_requested_replace < 1) return interaction.reply({ content: `You should specify a place to learn!`, ephemeral: true });

            user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                if (user.MoveReplace == undefined) return interaction.reply({ content: `You don't have any moves to replace!`, ephemeral: true });
                getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
                    var learn_name = "";
                    var user_pokemons = pokemons_from_database;
                    var selected_pokemon = user_pokemons.filter(it => it._id == user.MoveReplace[0])[0];
                    if (selected_pokemon == undefined || selected_pokemon == null) return interaction.reply({ content: `You don't have any moves to replace!`, ephemeral: true });
                    selected_pokemon.Moves = selected_pokemon.Moves == undefined ? {} : selected_pokemon.Moves;
                    learn_name = movesparser.movedata(user.MoveReplace[2]).name;
                    if (user.MoveReplace[1] == "TmMove") { learn_name += " (TM)"; selected_pokemon.TmMoves = _.without(selected_pokemon.TmMoves, user.MoveReplace[2]); }
                    if (selected_pokemon.Moves[user_requested_replace]) {
                        interaction.reply({ content: `${selected_pokemon.Moves[user_requested_replace]} is replaced with ${learn_name}.` });
                        selected_pokemon.Moves[user_requested_replace] = learn_name;
                    } else {
                        selected_pokemon.Moves[user_requested_replace] = learn_name;
                        interaction.reply({ content: `Your pokémon have learned ${learn_name}.` });
                    }
                    if (selected_pokemon.Held != "Everstone") selected_pokemon = isevolving(interaction, selected_pokemon, learn_name);
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
function isevolving(interaction, selected_pokemon, learn_name) {

    if (selected_pokemon.PokemonId == "142" && learn_name == "Rollout") {
        selected_pokemon.PokemonId = "685";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Lickitung evolved into a Shiny Lickilicky!` : `Your Lickitung evolved into a Lickilicky!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "148" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "687";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Tangela evolved into a Shiny Tangrowth!` : `Your Tangela evolved into a Tangrowth!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "637" && learn_name == "Mimic") {
        selected_pokemon.PokemonId = "218";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Mime Jr. evolved into a Shiny Mr. Mime!` : `Your Mime Jr. evolved into a Mr. Mime!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "636" && learn_name == "Mimic") {
        selected_pokemon.PokemonId = "285";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Bonsly evolved into a Shiny Sudowoodo!` : `Your Bonsly evolved into a Sudowoodo!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "290" && learn_name == "Double Hit") {
        selected_pokemon.PokemonId = "622";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Aipom evolved into a Shiny Ambipom!` : `Your Aipom evolved into a Ambipom!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "293" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "714";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Yanma evolved into a Shiny Yanmega!` : `Your Yanma evolved into a Yanmega!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "345" && learn_name == "Ancient Power") {
        selected_pokemon.PokemonId = "718";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Piloswine evolved into a Shiny Mamoswine!` : `Your Piloswine evolved into a Mamoswine!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "1290" && learn_name == "Stomp") {
        selected_pokemon.PokemonId = "1291";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Steenee evolved into a Shiny Tsareena!` : `Your Steenee evolved into a Tsareena!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "1334" && learn_name == "Dragon Pulse") {
        selected_pokemon.PokemonId = "1335";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Poipole evolved into a Shiny Naganadel!` : `Your Poipole evolved into a Naganadel!`;
        interaction.channel.send({ content: message_string });
    }
    else if (selected_pokemon.PokemonId == "1511" && learn_name == "Taunt") {
        selected_pokemon.PokemonId = "1512";
        var message_string = selected_pokemon.Shiny ? `Your Shiny Clobbopus evolved into a Shiny Grapploct!` : `Your Clobbopus evolved into a Grapploct!`;
        interaction.channel.send({ content: message_string });
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
    description: "Replace a move in your pokémon.",
    options: [{
        name: "move",
        description: "The move you want to replace.",
        required: true,
        type: 4,
        min_value: 1,
        max_value: 4
    }],
    aliases: []
}