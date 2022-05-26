const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');
const pagination = require('../utils/pagination');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length > 0) {
        var selected_pokemon = getPokemons.getPokemonData(args, pokemons);
        if (selected_pokemon == null) return message.channel.send(`This is not a valid pokemon!`);
        pokemon_embed(selected_pokemon)
    }
    else if (args.length == 0) {
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) console.log(err);
            getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                pokemon_embed(selected_pokemon);
            })
        })
    }

    function pokemon_embed(selected_pokemon) {

        var pokemon_moveset = get_pokemon_move(selected_pokemon["Pokemon Id"], pokemons);
        if (pokemon_moveset.length == 0) return message.channel.send("No TM found for this pokemon.");

        var chunked_moveset = chunkArray(pokemon_moveset, 20);
        var global_embed = [];
        var old_chunked_moveset_count = 1;
        for (a = 0; a < chunked_moveset.length; a++) {
            if (chunked_moveset[a] == undefined) break;

            var description = "";
            for (i = 0; i < chunked_moveset[a].length; i++) {
                var tmp_tm_number = chunked_moveset[a][i][0].toString();
                var pad = "000"
                var tm_num = pad.substring(0, pad.length - tmp_tm_number.length) + tmp_tm_number;
                description += `TM${tm_num} | ${chunked_moveset[a][i][1]}\n`
            }

            // Show Embedded Message.
            var embed = new Discord.MessageEmbed()
            embed.setColor(message.member.displayHexColor)
            embed.setTitle(`${selected_pokemon.name_no_shiny}'s TMs`)
            embed.setDescription(description)
            embed.setFooter(`Showing ${old_chunked_moveset_count} - ${old_chunked_moveset_count + chunked_moveset[a].length - 1} of ${pokemon_moveset.length} total TMs!`)
            global_embed.push(embed);
            old_chunked_moveset_count += chunked_moveset[a].length;
        }

        // Send message to channel.
        message.channel.send(global_embed[0]).then(msg => {
            if (global_embed.length == 1) return;
            pagination.createpage(message.channel.id, message.author.id, msg.id, global_embed, 0);
        });
    }
}

// Get pokemon name from pokemon ID.
function get_pokemon_move(pokemon_id, pokemons) {
    var moveset = [];
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];

    if (pokemon_db["Alternate Form Name"] == "Alola") {
        temp_name = pokemon_db["Pokemon Name"].replace(" ", "").replace(".", "").toLowerCase() + "alola";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    else if (pokemon_db["Alternate Form Name"] == "Galar") {
        temp_name = pokemon_db["Pokemon Name"].replace(" ", "").replace(".", "").toLowerCase() + "galar";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    else {
        temp_name = pokemon_db["Pokemon Name"].replace(" ", "").replace(".", "").toLowerCase();
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    return moveset;
}

// Chunk array into equal parts.
function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}

module.exports.config = {
    name: "tmmoves",
    aliases: []
}