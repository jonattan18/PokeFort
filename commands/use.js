const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const Sim = require('pokemon-showdown');

// Models
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const moveparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (isInt(args[0]) == false) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (args[0] > 4 || args[0] < 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }, { "Duel.Accepted": true }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('You are not in a duel!');

        var battle_stream = JSON.parse(prompt.Duel.BattleData);

        var player1_username = battle_stream.battle.sides[0].name;
        var player1_pokemon = battle_stream.battle.sides[0].pokemon[0].details.split(',')[0];
        var player2_username = battle_stream.battle.sides[1].name;
        var player2_pokemon = battle_stream.battle.sides[1].pokemon[0].details.split(',')[0];

        stream = new Sim.BattleStream();
        stream.load(battle_stream);
        //   console.log(stream);

        (async () => {
            for await (const output of stream) {
                console.log(output);
            }
        });

        stream.write('>p1 move 2');

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
    name: "use",
    aliases: []
}
