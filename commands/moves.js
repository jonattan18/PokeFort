const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length > 0) {
        var selected_pokemon = getPokemons.getPokemonData(args, pokemons);
        if (selected_pokemon == null) return message.channel.send(`This is not a valid pokemon!`);
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

                selected_pokemon.name_no_shiny = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, false);

                var embed_current_moves = [];
                for (var i = 0; i < 4; i++) {
                    if (selected_pokemon.Moves != undefined && selected_pokemon.Moves[i + 1] != undefined) {
                        var move_name = selected_pokemon.Moves[i + 1];
                        embed_current_moves.push(`Move ${i + 1}: ${move_name}`)
                    } else embed_current_moves.push(`Move ${i + 1}: Tackle`)
                }

                pokemon_embed(selected_pokemon, embed_current_moves)
            });
        });
    }

    function pokemon_embed(selected_pokemon, embed_current_moves) {
        //Get pokemon name.
        var pokemon_moveset = movesparser.get_pokemon_move_from_id(selected_pokemon.PokemonId, pokemons, false, true);
        if (pokemon_moveset == null) return message.channel.send(`Unable to find moves for this pokemon!`);
        pokemon_moveset = pokemon_moveset.filter(it => it[0] <= selected_pokemon.Level);

        // Show Embedded Message.
        var embed = new Discord.MessageEmbed()
        embed.setColor(message.member.displayHexColor)
        embed.setTitle(title)
        if (embed_current_moves != undefined) {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: Level ${selected_pokemon.Level} ${selected_pokemon.name_no_shiny}`; }
            else { title = `Level ${selected_pokemon.Level} ${selected_pokemon.name_no_shiny}`; }
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
                    var move_data = movesparser.movedata(selected_pokemon.TmMoves[i]);
                    if (move_data.category == "Status") var move_name = move_data.name + " :lock:"
                    else var move_name = move_data.name
                    tm_moves += `${move_name}\n`;
                }
                embed.addField("Available TMs", tm_moves, true);
            }
            embed.setFooter(`You have ${pokemon_moveset.length} moves to learn and use in battle!\nThe moves with 🔒 can only be used in raids.`);
        }
        else {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: ${selected_pokemon.name_no_shiny}'s moves`; }
            else { title = `${selected_pokemon.name_no_shiny}'s moves`; }
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

module.exports.config = {
    name: "moves",
    aliases: []
}