const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');
const fs = require('fs'); // To read json file.

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`You should specify a move to learn!`); return; }

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
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

            //Get Pokemon Name from Pokemon ID.
            if (pokemon_db["Alternate Form Name"] == "Mega X" || pokemon_db["Alternate Form Name"] == "Mega Y") {
                var pokemon_name = `Mega ${pokemon_db["Pokemon Name"]} ${pokemon_db["Alternate Form Name"][pokemon_db["Alternate Form Name"].length - 1]}`
            }
            else {
                var temp_name = "";
                if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
                else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
                else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
                else { temp_name = pokemon_db["Pokemon Name"]; }
                var pokemon_name = temp_name;
            }

            //Get pokemon name.
            var pokemon_moveset = get_pokemon_move(selected_pokemon.PokemonId, pokemons);
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
                user.MoveReplace = [selected_pokemon._id.toString(), 'TmMove', movesparser.movedataname(current_move).num];
            }
            else if (available_moves.some(x => x.toLowerCase() == args.join(" ").toLowerCase())) {
                current_move = available_moves.filter(it => it.toLowerCase() == args.join(" ").toLowerCase())[0];
                user.MoveReplace = [selected_pokemon._id.toString(), 'Move', movesparser.movedataname(current_move).num];
            }
            else return message.channel.send(`Your pokemon cannot learn that move.`);

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
}

// Get pokemon name from pokemon ID.
function get_pokemon_move(pokemon_id, pokemons) {
    var moveset = [];
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];

    if (pokemon_db["Alternate Form Name"] == "Alola") {
        temp_name = pokemon_db["Pokemon Name"] + "alola";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset, true);
    }
    else if (pokemon_db["Alternate Form Name"] == "Galar") {
        temp_name = pokemon_db["Pokemon Name"] + "galar";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset, true);
    }
    else {
        temp_name = pokemon_db["Pokemon Name"];
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset, true);
    }
    return moveset;
}

module.exports.config = {
    name: "learn",
    aliases: []
}