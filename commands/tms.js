const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');
const pagination = require('../utils/pagination');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (interaction.options.get("pokemon") != null) {
        var selected_pokemon = getPokemons.getPokemonData(interaction.options.get("pokemon").value.split(" "), pokemons);
        if (selected_pokemon == null) return interaction.reply({ content: `This is not a valid pokemon!`, ephemeral: true });
        pokemon_embed(selected_pokemon)
    }
    else if (interaction.options.get("pokemon") == null) {
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) console.log(err);
            getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
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
        if (pokemon_moveset.length == 0) return interaction.reply({ content: `No TM found for this pokemon.`, ephemeral: true });

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
            var embed = new Discord.EmbedBuilder();
            embed.setColor(interaction.member.displayHexColor)
            embed.setTitle(`${selected_pokemon.name_no_shiny}'s TMs`)
            embed.setDescription(description)
            embed.setFooter({ text: `Showing ${old_chunked_moveset_count} - ${old_chunked_moveset_count + chunked_moveset[a].length - 1} of ${pokemon_moveset.length} total TMs!` })
            global_embed.push(embed);
            old_chunked_moveset_count += chunked_moveset[a].length;
        }

        // Send message to channel.
        interaction.reply({ embeds: [global_embed[0]], fetchReply: true }).then(msg => {
            if (global_embed.length == 1) return;
            pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, global_embed, 0);
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
    name: "tms",
    description: "Get all the TM moves of a pokemon.",
    options: [{
        name: "pokemon",
        description: "Shows TM moves of given pokemon.",
        type: 3
    }],
    aliases: []
}