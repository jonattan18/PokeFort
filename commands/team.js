const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) { console.log(err); return; }

        var team = user.Teams.filter(team => team.Selected == true)[0];
        if (team == undefined || team.length == 0) {
            return interaction.reply({ content: `You should select a team first!`, ephemeral: true });
        }
        else {
            getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {
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
                            pokemon_details = `You do not own the pokémon at this position! Please do /teamedit ${i + 1} <pokemon number> to replace it.`;
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
    });
}

module.exports.config = {
    name: "team",
    description: "Shows your team!",
    aliases: []
}