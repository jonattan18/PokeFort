const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);

        if (interaction.options.get("id") == null) {
            if (user.Teams.length == 0) return interaction.reply({ content: `You don't have any teams!` });
            else {
                var id_counter = 0;
                var temp_counter = 0;
                var tot_len = user.Teams.length;
                var split_chunks = spliceIntoChunks(user.Teams, 20);
                var embeds = [];
                var current_index = 0;
                for (i = 0; i < split_chunks.length; i++) {
                    embeds[i] = new Discord.EmbedBuilder();
                    embeds[i].setTitle("Your teams:");
                    var description = "";
                    temp_counter += split_chunks[i].length;
                    for (j = 0; j < split_chunks[i].length; j++) {
                        id_counter++;
                        current_index = temp_counter - split_chunks[i].length + 1;
                        description += `${id_counter} | ${split_chunks[i][j]["TeamName"]}\n`;
                    }
                    embeds[i].setDescription(description);
                    embeds[i].setFooter({ text: `Page: ${i + 1}/${split_chunks.length} Showing ${current_index} to ${(current_index - 1) + split_chunks[i].length} out of ${tot_len} total teams! Do /teamselect <id> to select a team!` });
                }
                interaction.reply({ embeds: [embeds[0]] }).then(msg => {
                    if (split_chunks.length > 1) return pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, embeds, 0);
                    else return;
                });
            }
        }
        else if (interaction.options.get("id") != null) {
            var team_id = interaction.options.get("id").value;
            if (!isInt(team_id)) return interaction.reply({ content: `_${team_id}_ is not a valid team ID!`, ephemeral: true });
            if (user.Teams[team_id - 1] == undefined) return interaction.reply({ content: `You don't have a team with ID _${team_id}_!`, ephemeral: true });

            getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {
                var team = user.Teams[team_id - 1];
                var embed = new Discord.EmbedBuilder();
                embed.setTitle(`${team["TeamName"]}`);
                for (i = 0; i < team["Pokemons"].length; i++) {
                    var pokemon_title = "";
                    var pokemon_details = "";
                    if (team["Pokemons"][i] == null) {
                        pokemon_title = `Pokemon #${i + 1}`;
                        pokemon_details = `You do not own the pokémon at this position! Please do /teamedit ${i + 1} <pokemon number> to replace it.`;
                        embed.addFields({ name: pokemon_title, value: pokemon_details, inline: true });
                    }
                    else {
                        var pokemon_from_db = user_pokemons.filter(it => it._id == team["Pokemons"][i])[0];
                        if (pokemon_from_db == undefined) {
                            var pokemon_title = "";
                            var pokemon_details = "";
                            pokemon_title = `Pokemon #${i + 1}`;
                            pokemon_details = `You do not own the pokémon at this position! Please do /teamedit ${i + 1} <pokemon number to replace it.`;
                            embed.addFields({ name: pokemon_title, value: pokemon_details, inline: true });
                        }
                        else {
                            var pokemon_title = `#${i + 1} | Level ${pokemon_from_db.Level} ${getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, pokemon_from_db.Shiny, true)} | ID: ${user_pokemons.indexOf(pokemon_from_db) + 1}`;
                            var move_arr = [];
                            for (var j = 0; j < 4; j++) {
                                if (pokemon_from_db.Moves != undefined && pokemon_from_db.Moves[j + 1] != undefined) {
                                    var move_name = pokemon_from_db.Moves[j + 1];
                                    move_arr.push(move_name);
                                } else move_arr.push(`Tackle`)
                            }
                            var pokemon_details = `Moves: ${move_arr.join(", ")}`;
                            embed.addFields({ name: pokemon_title, value: pokemon_details, inline: true });
                        }
                    }
                }
                embed.setFooter({ text: `To edit your team, select it and do /teamedit <position> <pokemon number> to add a pokémon to your team!` });
                interaction.reply({ embeds: [embed] });
            });
        }
        else return interaction.reply({ content: `Invalid syntax!`, ephemeral: true });
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
    description: "Shows all of your teams!",
    options: [{
        name: "id",
        description: "Shows a specific team!",
        required: false,
        type: 4,
        min_value: 1
    }],
    aliases: []
}