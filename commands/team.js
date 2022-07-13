const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length > 1) return message.channel.send(`Invalid syntax!`);

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) { console.log(err); return; }

        if (args.length == 0) {
            var team = user.Teams.filter(team => team.Selected == true)[0];
            if (team == undefined) {
                return message.channel.send(`You should select a team first!`);
            }
            else {
                getPokemons.getallpokemon(message.author.id).then(user_pokemons => {
                    var embed = new Discord.MessageEmbed();
                    embed.setTitle(`${team["TeamName"]}`);
                    for (i = 0; i < team["Pokemons"].length; i++) {
                        var pokemon_title = "";
                        var pokemon_details = "";
                        if (team["Pokemons"][i] == null) {
                            pokemon_title = `Pokemon #${i + 1}`;
                            pokemon_details = `You do not own the pokémon at this position! Please do ${prefix}teamedit ${i + 1} <pokemon number to replace it.`;
                            embed.addField(pokemon_title, pokemon_details, true);
                        }
                        else {
                            var pokemon_from_db = user_pokemons.filter(it => it._id == team["Pokemons"][i])[0];
                            if (pokemon_from_db == undefined) {
                                var pokemon_title = "";
                                var pokemon_details = "";
                                pokemon_title = `Pokemon #${i + 1}`;
                                pokemon_details = `You do not own the pokémon at this position! Please do ${prefix}teamedit ${i + 1} <pokemon number> to replace it.`;
                                embed.addField(pokemon_title, pokemon_details, true);
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
                                embed.addField(pokemon_title, pokemon_details, true);
                            }
                        }
                    }
                    embed.setFooter(`To edit your team, select it and do ${prefix}teamedit <position> <pokemon number> to add a pokémon to your team!`);
                    message.channel.send(embed);
                });
            }
        }
        else return message.channel.send(`Invalid syntax!`);
    });
}

module.exports.config = {
    name: "team",
    aliases: []
}