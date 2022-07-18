const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

// Misc
const config = require("../config/config.json");

// Models
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`You should specify a move to learn!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return message.channel.send("You can't learn pokémon moves while you are in a duel!");

        //Get user data.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            var current_move = "";
            var available_moves = [];
            var available_tm_moves = [];

            getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];

                //Get Pokemon Name from Pokemon ID.
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, false);

                //Get pokemon name.
                var pokemon_moveset = movesparser.get_pokemon_move_from_id(selected_pokemon.PokemonId, pokemons);
                pokemon_moveset = pokemon_moveset.filter(it => it[0] <= selected_pokemon.Level);

                if (selected_pokemon.TmMoves != undefined && selected_pokemon.TmMoves.length > 0) {
                    for (var i = 0; i < selected_pokemon.TmMoves.length; i++) {
                        var move_name = movesparser.movedata(selected_pokemon.TmMoves[i], true).name;
                        available_tm_moves.push(move_name);
                    }
                }

                for (var i = 0; i < pokemon_moveset.length; i++) {
                    available_moves.push(pokemon_moveset[i][1]);
                }

                if (available_tm_moves.some(x => x.toLowerCase() == args.join(" ").toLowerCase())) {
                    current_move = available_tm_moves.filter(it => it.toLowerCase() == args.join(" ").toLowerCase())[0];
                    if (config.MOVES_CANT_BE_LEARNT.includes(movesparser.movedataname(current_move).name)) return message.channel.send(`This move can't be learned as it is not usable in duel or raid.`);
                    user.MoveReplace = [selected_pokemon._id.toString(), 'TmMove', movesparser.movedataname(current_move).num];
                }
                else if (available_moves.some(x => x.toLowerCase() == args.join(" ").toLowerCase())) {
                    current_move = available_moves.filter(it => it.toLowerCase() == args.join(" ").toLowerCase())[0];
                    if (config.MOVES_CANT_BE_LEARNT.includes(movesparser.movedataname(current_move).name)) return message.channel.send(`This move can't be learned as it is not usable in duel or raid.`);
                    user.MoveReplace = [selected_pokemon._id.toString(), 'Move', movesparser.movedataname(current_move).num];
                }
                else return message.channel.send(`Your pokémon cannot learn that move.`);

                user.save().then(() => {
                    var embed = new Discord.MessageEmbed();
                    embed.setTitle(`${pokemon_name}'s moves`);
                    embed.setColor(message.member.displayHexColor)
                    embed.setDescription(`Select the move you want to replace with ${current_move}`);
                    for (var i = 0; i < 4; i++) {
                        if (selected_pokemon.Moves != undefined && selected_pokemon.Moves[i + 1] != undefined) {
                            var move_name = selected_pokemon.Moves[i + 1];
                            embed.addField(`${move_name}`, `${prefix}replace ${i + 1}`, true)
                        } else embed.addField(`Tackle`, `${prefix}replace ${i + 1}`, true)
                    }
                    message.channel.send(embed);
                });
            });
        });
    });
}

module.exports.config = {
    name: "learn",
    aliases: []
}