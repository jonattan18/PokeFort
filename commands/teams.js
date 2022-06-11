const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length > 1) return message.channel.send(`Invalid syntax!`);

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) { console.log(err); return; }

        if (args.length == 0) {
            if (user.Teams.length == 0) return message.channel.send("You don't have any teams!");
            else {
                var id_counter = 0;
                var temp_counter = 0;
                var tot_len = user.Teams.length;
                var split_chunks = spliceIntoChunks(user.Teams, 20);
                var embeds = [];
                var current_index = 0;
                for (i = 0; i < split_chunks.length; i++) {
                    embeds[i] = new Discord.MessageEmbed();
                    embeds[i].setTitle("Your teams:");
                    var description = "";
                    temp_counter += split_chunks[i].length;
                    for (j = 0; j < split_chunks[i].length; j++) {
                        id_counter++;
                        current_index = temp_counter - split_chunks[i].length + 1;
                        description += `${id_counter} | ${split_chunks[i][j]["TeamName"]}\n`;
                    }
                    embeds[i].setDescription(description);
                    embeds[i].setFooter(`Page: ${i + 1}/${split_chunks.length} Showing ${current_index} to ${(current_index - 1) + split_chunks[i].length} out of ${tot_len} total teams! Do ${prefix}teamselect <id> to select a team!`);
                }
                message.channel.send(embeds[0]).then(msg => {
                    if (split_chunks.length > 1) return pagination.createpage(message.channel.id, message.author.id, msg.id, embeds, 0);
                    else return;
                });
            }
        }
        else if (args.length == 1) {
            if (!isInt(args[0])) return message.channel.send(`_${args[0]}_ is not a valid team ID!`);
            if (user.Teams[args[0] - 1] == undefined) return message.channel.send(`You don't have a team with ID _${args[0]}_!`);

            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {
                var team = user.Teams[args[0] - 1];
                var embed = new Discord.MessageEmbed();
                embed.setTitle(`${team["TeamName"]}`);
                for (i = 0; i < team["Pokemons"].length; i++) {
                    var pokemon_title = "";
                    var pokemon_details = "";
                    if (team["Pokemons"][i] == null) {
                        pokemon_title = `Pokemon #${i + 1}`;
                        pokemon_details = `You do not own the pokemon at this position! Please do ${prefix}teamedit ${i + 1} <pokemon number to replace it.`;
                        embed.addField(pokemon_title, pokemon_details, true);
                    }
                    else {
                        var pokemon_from_db = user_pokemons.filter(it => it._id == team["Pokemons"][i])[0];
                        if (pokemon_from_db == undefined) {
                            var pokemon_title = "";
                            var pokemon_details = "";
                            pokemon_title = `Pokemon #${i + 1}`;
                            pokemon_details = `You do not own the pokemon at this position! Please do ${prefix}teamedit ${i + 1} <pokemon number to replace it.`;
                            embed.addField(pokemon_title, pokemon_details, true);
                        }
                        else {
                            var pokemon_title = `#${i + 1} | Level ${pokemon_from_db.Level} ${getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, pokemon_from_db.Shiny, true)} | ID: ${user_pokemons.indexOf(pokemon_from_db) + 1}`;
                            var move_arr = [];
                            for (var j = 0; j < 4; j++) {
                                if (pokemon_from_db.Moves != undefined && pokemon_from_db.Moves[j + 1] != undefined) {
                                    var move_name = selected_pokemon.Moves[j + 1];
                                    move_arr.push(move_name);
                                } else move_arr.push(`Tackle`)
                            }
                            var pokemon_details = `Moves: ${move_arr.join(", ")}`;
                            embed.addField(pokemon_title, pokemon_details, true);
                        }
                    }
                }
                embed.setFooter(`To edit your team, select it and do ${prefix}teamedit <position> <pokemon number> to add a pokemon to your team!`);
                message.channel.send(embed);
            });
        }
        else return message.channel.send(`Invalid syntax!`);
    });
}

// Function to chunk given data.
function spliceIntoChunks(arr, chunkSize) {
    const res = [];
    while (arr.length > 0) {
        const chunk = arr.splice(0, chunkSize);
        res.push(chunk);
    }
    return res;
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
    name: "teams",
    aliases: []
}