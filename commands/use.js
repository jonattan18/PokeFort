const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const fs = require('fs');

// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

// Models
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const moveparser = require('../utils/moveparser');
const battle = require('../utils/battle');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (isInt(args[0]) == false) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (args[0] > 4 || args[0] < 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }, { "Duel.Accepted": true }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('You are not in a duel!');

        var duel_data = prompt.Duel;
        var user1_data = duel_data.User1Pokemon;
        var user2_data = duel_data.User2Pokemon;

        if (prompt.UserID.User1ID == message.author.id) {
            if (duel_data.Turn != 1) return message.channel.send('It is not your turn!');
            var user_1_pokemon = pokemons.filter(it => it["Pokemon Id"] == user1_data.PokemonID)[0];
            var user_2_pokemon = pokemons.filter(it => it["Pokemon Id"] == user2_data.PokemonID)[0];
            var move_used = user1_data.Moves[args[0] - 1].replaceAll(" ", "").replace(/[^a-zA-Z ]/g, "").toLowerCase();
            var move_used_info = moveinfo[move_used];
            var pokemon_level = user1_data.PokemonLevel;
            var damage = battle.calculate_damage(user_1_pokemon, user1_data.Attack, user2_data.Defense, pokemon_level, move_used_info, user_2_pokemon);

            // Create embed for damage.
            const embed = new Discord.MessageEmbed()
            embed.setTitle(`${duel_data.User1name}'s ${user1_data.PokemonName} used ${move_used}!`)
            embed.setDescription(damage[1]);
            embed.setColor(message.member.displayHexColor);
            message.channel.send(embed);

            prompt.Duel.User2Pokemon.ActiveHP -= damage;
            if (prompt.Duel.User2Pokemon.ActiveHP <= 0) {

                // Xp gained calculations.
                

                // Create embed for damage fainted.
                const embed = new Discord.MessageEmbed()
                embed.setTitle(`${duel_data.User2name}'s ${user2_data.PokemonName} fainted.`)
                embed.setDescription(`${duel_data.User1name}'s ${user1_data.PokemonName} gained exp.`);
                embed.setColor(message.member.displayHexColor);
                message.channel.send(embed);
            }
        }

        if (prompt.UserID.User2ID == message.author.id) {
            if (duel_data.Turn != 2) return message.channel.send('It is not your turn!');

        }

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
