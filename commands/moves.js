const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length > 0) {
        var selected_pokemon = getPokemons.pokemondata(args, pokemons);
        selected_pokemon.Level = 100;
        pokemon_embed(selected_pokemon)
    }
    else if (args.length == 0) {
        //Get user data.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) console.log(err);
            getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];

                var embed_current_moves = [];
                for (var i = 0; i < 4; i++) {
                    if (selected_pokemon.Moves != undefined && selected_pokemon.Moves[i + 1] != undefined) {
                        var move_name = selected_pokemon.Moves[i + 1];
                        embed_current_moves.push(`Move ${i + 1}: ${move_name}`)
                    } else embed_current_moves.push(`Move ${i + 1}: None`)
                }

                pokemon_embed(selected_pokemon, embed_current_moves)
            });
        });
    }

    function pokemon_embed(selected_pokemon, embed_current_moves) {

        //Get pokemon name.
        var pokemon_moveset = get_pokemon_move(selected_pokemon.PokemonId, pokemons);
        pokemon_moveset = pokemon_moveset.filter(it => it[0] <= selected_pokemon.Level);

        // Show Embedded Message.
        var embed = new Discord.MessageEmbed()
        embed.setColor(message.member.displayHexColor)
        embed.setTitle(title)
        if (embed_current_moves != undefined) {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: Level ${selected_pokemon.Level} ${get_pokemon_full_name(selected_pokemon, pokemons)}`; }
            else { title = `Level ${selected_pokemon.Level} ${get_pokemon_full_name(selected_pokemon, pokemons)}`; }
            embed.setTitle(title)
            embed.setDescription(`To learn a move do ${prefix}learn <move>`);
            embed.addField("Current Moves", embed_current_moves.join("\n"));
            var available_moves = "";
            for (var i = 0; i < pokemon_moveset.length; i++) {
                available_moves += `${pokemon_moveset[i][1]}\n`;
            }
            embed.addField("Available Moves", available_moves, true);
            if (selected_pokemon.TmMoves != undefined && selected_pokemon.TmMoves.length > 0) {
                var tm_moves = "";
                for (var i = 0; i < selected_pokemon.TmMoves.length; i++) {
                    var move_name = movesparser.movedata(selected_pokemon.TmMoves[i]).name;
                    tm_moves += `${move_name}\n`;
                }
                embed.addField("Available TMs", tm_moves, true);
            }
            embed.setFooter(`You have ${pokemon_moveset.length} moves to learn and use in battle!`);
        }
        else {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: ${get_pokemon_full_name(selected_pokemon, pokemons)}'s moves`; }
            else { title = `${get_pokemon_full_name(selected_pokemon, pokemons)}'s moves`; }
            var description = "";
            for (var i = 0; i < pokemon_moveset.length; i++) {
                description += `${pokemon_moveset[i][1].replace(":lock:", "")} | Level: ${pokemon_moveset[i][0]} \n`
            }
            if (selected_pokemon.imageurl) { embed.attachFiles(selected_pokemon.imageurl); embed.setThumbnail('attachment://' + selected_pokemon.imagename); }
            embed.setTitle(title);
            embed.setDescription(description);
        }
        message.channel.send(embed);

    }
}

// Get pokemon name from pokemon ID.
function get_pokemon_full_name(selected_pokemon, pokemons) {
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

    if (selected_pokemon.Nickname) { var name = `'${selected_pokemon.Nickname}'` }
    else { var name = pokemon_name }

    return name;
}

// Get pokemon name from pokemon ID.
function get_pokemon_move(pokemon_id, pokemons) {
    var moveset = [];
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];

    if (pokemon_db["Alternate Form Name"] == "Alola") {
        temp_name = pokemon_db["Pokemon Name"] + "alola";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset);
    }
    else if (pokemon_db["Alternate Form Name"] == "Galar") {
        temp_name = pokemon_db["Pokemon Name"] + "galar";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset);
    }
    else {
        temp_name = pokemon_db["Pokemon Name"];
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset);
    }
    return moveset;
}

module.exports.config = {
    name: "moves",
    aliases: []
}