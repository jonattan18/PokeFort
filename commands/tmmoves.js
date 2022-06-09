const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

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
                selected_pokemon.name_no_shiny = getPokemons.get_pokemon_name_from_id(selected_pokemon["PokemonId"], pokemons, false);
                selected_pokemon["Pokemon Id"] = selected_pokemon.PokemonId;
                pokemon_embed(selected_pokemon);
            })
        })
    }

    function pokemon_embed(selected_pokemon) {

        var pokemon_moveset = movesparser.get_pokemon_move_from_id(selected_pokemon["Pokemon Id"], pokemons, true);
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