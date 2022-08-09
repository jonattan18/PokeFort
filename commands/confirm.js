const Discord = require('discord.js'); // For message embed.
const _ = require('lodash'); // for utils
const mongoose = require('mongoose');

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const pokemons_model = require('../models/pokemons');
const raid_model = require('../models/raids');

// Utils
const getPokemons = require('../utils/getPokemon');

// Config
const config = require('../config/config.json');

//FIXME: Not completed

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``confirm`` command.');

        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid && raid.CurrentDuel != undefined && raid.CurrentDuel == message.author.id) return message.channel.send("You can't do this while you are in a raid!");
            else {

                // If user prompt is for release
                if (prompt.PromptType == "Release") {
                    return release(message, prompt);
                }

                // If user prompt is for recycle
                else if (prompt.PromptType == "Recycle") {
                    return recycle(message, prompt, pokemons);
                }

                // If user prompt is for trade
                else if (prompt.PromptType == "Trade" && prompt.Trade.Accepted == true) {
                    return trade(message, prompt, pokemons);
                }

                else return message.channel.send('No prompt asked for to use ``confirm`` command.');

            }
        });
    });
}

// Function to trade pokemon.
function trade(message, trade_prompt, pokemons) {
    var current_user = 0;
    if (message.author.id == trade_prompt.UserID.User1ID) {
        current_user = 1;
    } else {
        current_user = 2;
    }

    if (current_user == 1) {
        if (trade_prompt.Trade.User1IConfirm == false && trade_prompt.Trade.User2IConfirm == true) {
            trade_prompt.Trade.User1IConfirm = true;
            trade_prompt.save().then(() => {
                message.channel.messages.fetch(trade_prompt.Trade.MessageID).then(message_old => {
                    var new_embed = message_old.embeds[0];
                    new_embed.fields[0].name += " | :white_check_mark:";
                    message_old.edit(new_embed);
                    change_trade(message, trade_prompt, pokemons);
                });
            });
        }
        else if (trade_prompt.Trade.User1IConfirm == true && trade_prompt.Trade.User2IConfirm == false) {
            message.channel.send(`You have already confirmed the trade!`);
        }
        else if (trade_prompt.Trade.User1IConfirm == false && trade_prompt.Trade.User2IConfirm == false) {
            trade_prompt.Trade.User1IConfirm = true;
            trade_prompt.save().then(() => {
                message.channel.messages.fetch(trade_prompt.Trade.MessageID).then(message_old => {
                    var new_embed = message_old.embeds[0];
                    new_embed.fields[0].name += " | :white_check_mark:";
                    message_old.edit(new_embed);
                });
            });
        }
    }
    else if (current_user == 2) {
        if (trade_prompt.Trade.User2IConfirm == false && trade_prompt.Trade.User1IConfirm == true) {
            trade_prompt.Trade.User2IConfirm = true;
            trade_prompt.save().then(() => {
                message.channel.messages.fetch(trade_prompt.Trade.MessageID).then(message_old => {
                    var new_embed = message_old.embeds[0];
                    var last_index = parseInt((trade_prompt.Trade.User1Items.length - 1) / config.TRADE_POKEMON_PER_PAGE) + 1;
                    new_embed.fields[last_index].name += " | :white_check_mark:";
                    message_old.edit(new_embed);
                    change_trade(message, trade_prompt, pokemons);
                });
            });
        }
        else if (trade_prompt.Trade.User2IConfirm == true && trade_prompt.Trade.User1IConfirm == false) {
            message.channel.send(`You have already confirmed the trade!`);
        }
        else if (trade_prompt.Trade.User2IConfirm == false && trade_prompt.Trade.User1IConfirm == false) {
            trade_prompt.Trade.User2IConfirm = true;
            trade_prompt.save().then(() => {
                message.channel.messages.fetch(trade_prompt.Trade.MessageID).then(message_old => {
                    var new_embed = message_old.embeds[0];
                    var last_index = parseInt((trade_prompt.Trade.User1Items.length - 1) / config.TRADE_POKEMON_PER_PAGE) + 1;
                    new_embed.fields[last_index].name += " | :white_check_mark:";
                    message_old.edit(new_embed);
                });
            });
        }
    }
}

// Function to change items in trade.
function change_trade(message, trade_prompt, pokemons) {
    (async => {
        // User 1 details
        user_model.findOne({ UserID: trade_prompt.UserID.User1ID }, (err1, user1) => {
            if (err1) return console.log(err1);
            // User 2 details
            user_model.findOne({ UserID: trade_prompt.UserID.User2ID }, (err2, user2) => {
                if (err2) return console.log(err2);

                //#region Transfer credits.
                var user_1_credits = trade_prompt.Trade.Credits.User1 == undefined ? 0 : trade_prompt.Trade.Credits.User1;
                var user_2_credits = trade_prompt.Trade.Credits.User2 == undefined ? 0 : trade_prompt.Trade.Credits.User2;

                // For user 1
                if (user_1_credits > 0) {
                    if ((user1.PokeCredits - user_1_credits) < 0) { return message.channel.send(`You don't have enough credits to complete the trade!`); }
                    user1.PokeCredits -= user_1_credits;
                    user2.PokeCredits += user_1_credits;
                }

                // For user 2
                if (user_2_credits > 0) {
                    if ((user2.PokeCredits - user_2_credits) < 0) { return message.channel.send(`You don't have enough credits to complete the trade!`); }
                    user1.PokeCredits += user_2_credits;
                    user2.PokeCredits -= user_2_credits;
                }
                //#endregion

                //#region Transfer redeems.
                var user_1_redeems = trade_prompt.Trade.Redeems.User1 == undefined ? 0 : trade_prompt.Trade.Redeems.User1;
                var user_2_redeems = trade_prompt.Trade.Redeems.User2 == undefined ? 0 : trade_prompt.Trade.Redeems.User2;

                // For user 1
                if (user_1_redeems > 0) {
                    if ((user1.Redeems - user_1_redeems) < 0) { return message.channel.send(`You don't have enough redeems to complete the trade!`); }
                    user1.Redeems -= user_1_redeems;
                    user2.Redeems += user_1_redeems;
                }
                if (user_2_redeems > 0) {
                    if ((user2.Redeems - user_2_redeems) < 0) { return message.channel.send(`You don't have enough redeems to complete the trade!`); }
                    user1.Redeems += user_2_redeems;
                    user2.Redeems -= user_2_redeems;
                }
                //#endregion

                //#region Transfer shards.
                var user_1_shards = trade_prompt.Trade.Shards.User1 == undefined ? 0 : trade_prompt.Trade.Shards.User1;
                var user_2_shards = trade_prompt.Trade.Shards.User2 == undefined ? 0 : trade_prompt.Trade.Shards.User2;

                // For user 1
                if (user_1_shards > 0) {
                    if ((user1.Shards - user_1_shards) < 0) { return message.channel.send(`You don't have enough shards to complete the trade!`); }
                    user1.Shards -= user_1_shards;
                    user2.Shards += user_1_shards;
                }

                // For user 2
                if (user_2_shards > 0) {
                    if ((user2.Shards - user_2_shards) < 0) { return message.channel.send(`You don't have enough shards to complete the trade!`); }
                    user1.Shards += user_2_shards;
                    user2.Shards -= user_2_shards;
                }
                //#endregion

                //#region Transfer Pokemons.
                var user_1_items = trade_prompt.Trade.User1Items == undefined ? [] : trade_prompt.Trade.User1Items;
                var user_2_items = trade_prompt.Trade.User2Items == undefined ? [] : trade_prompt.Trade.User2Items;
                var user_1_trade_evolutions = [];
                var user_2_trade_evolutions = [];

                // For user 1
                if (user_1_items.length > 0) {
                    getPokemons.getallpokemon(trade_prompt.UserID.User1ID).then(function (user_pokemons) {

                        var pokemons_to_add = [];
                        var pokemons_to_delete = [];
                        for (i = 0; i < user_1_items.length; i++) {
                            var user_pokemon_to_add = user_pokemons.filter(pokemon => JSON.stringify(pokemon) == JSON.stringify(user_1_items[i]))[0];
                            if (user_pokemon_to_add != undefined) {
                                user_pokemon_to_add.Reason = "Traded";

                                // Trade Evolution Verify.
                                user_pokemon_to_add.Held = user_pokemon_to_add.Held == undefined ? "NULL" : user_pokemon_to_add.Held;
                                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemon_to_add.PokemonId)[0];
                                if (pokemon_db["Evolution Trade"] != undefined) {
                                    var all_evolutions = pokemon_db["Evolution Trade"];
                                    var get_current_evolution = [];
                                    if (all_evolutions[0][0].length > 1) get_current_evolution = all_evolutions.filter(it => it[0].toLowerCase() == user_pokemon_to_add.Held.toLowerCase());
                                    else get_current_evolution = [all_evolutions];
                                    if (get_current_evolution.length > 0) {
                                        var current_evolution = get_current_evolution[0];
                                        user_pokemon_to_add.PokemonId = current_evolution[1];
                                        var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_db["Pokemon Id"], pokemons, user_pokemon_to_add.Shiny);
                                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(user_pokemon_to_add.PokemonId, pokemons, user_pokemon_to_add.Shiny);
                                        user_pokemon_to_add.Held = undefined;
                                        user_1_trade_evolutions.push([old_pokemon_name, new_pokemon_name]);
                                    }
                                }

                                pokemons_to_delete.push(user_pokemon_to_add._id);
                                pokemons_to_add.push(user_pokemon_to_add);
                            }
                        }

                        var selected_pokemon = pokemons_to_delete.filter(it => it._id == user1.Selected)[0];
                        if (selected_pokemon != undefined) {
                            var current_pokemon = _.differenceBy(user_pokemons, pokemons_to_delete, '_id')
                            user_model.findOneAndUpdate({ UserID: trade_prompt.UserID.User1ID }, { $set: { Selected: current_pokemon[0]._id } }, (err, result) => {
                                if (err) console.log(err)
                                message.channel.send(`You have traded your selected pokemon. Pokémon Number 1 selected!`);
                            })
                        }

                        getPokemons.deletepokemon(pokemons_to_delete);
                        getPokemons.insertpokemon(trade_prompt.UserID.User2ID, pokemons_to_add);
                    });
                }

                // For user 2
                if (user_2_items.length > 0) {
                    getPokemons.getallpokemon(trade_prompt.UserID.User2ID).then(function (user_pokemons) {

                        var pokemons_to_add = [];
                        var pokemons_to_delete = [];
                        for (i = 0; i < user_2_items.length; i++) {
                            var user_pokemon_to_add = user_pokemons.filter(pokemon => JSON.stringify(pokemon) == JSON.stringify(user_2_items[i]))[0];
                            if (user_pokemon_to_add != undefined) {
                                user_pokemon_to_add.Reason = "Traded";

                                // Trade Evolution Verify.
                                user_pokemon_to_add.Held = user_pokemon_to_add.Held == undefined ? "NULL" : user_pokemon_to_add.Held;
                                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemon_to_add.PokemonId)[0];
                                if (pokemon_db["Evolution Trade"] != undefined) {
                                    var all_evolutions = pokemon_db["Evolution Trade"];
                                    var get_current_evolution = [];
                                    if (all_evolutions[0][0].length > 1) get_current_evolution = all_evolutions.filter(it => it[0].toLowerCase() == user_pokemon_to_add.Held.toLowerCase());
                                    else get_current_evolution = [all_evolutions];
                                    if (get_current_evolution.length > 0) {
                                        var current_evolution = get_current_evolution[0];
                                        user_pokemon_to_add.PokemonId = current_evolution[1];
                                        var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_db["Pokemon Id"], pokemons, user_pokemon_to_add.Shiny);
                                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(user_pokemon_to_add.PokemonId, pokemons, user_pokemon_to_add.Shiny);
                                        user_pokemon_to_add.Held = undefined;
                                        user_2_trade_evolutions.push([old_pokemon_name, new_pokemon_name]);
                                    }
                                }
                            }

                            pokemons_to_delete.push(user_pokemon_to_add._id);
                            pokemons_to_add.push(user_pokemon_to_add);
                        }

                        var selected_pokemon = pokemons_to_delete.filter(it => it._id == user2.Selected)[0];
                        if (selected_pokemon != undefined) {
                            var current_pokemon = _.differenceBy(user_pokemons, pokemons_to_delete, '_id')
                            user_model.findOneAndUpdate({ UserID: trade_prompt.UserID.User2ID }, { $set: { Selected: current_pokemon[0]._id } }, (err, result) => {
                                if (err) console.log(err)
                                message.channel.send(`You have traded your selected pokemon. Pokémon Number 1 selected!`);
                            })
                        }

                        getPokemons.deletepokemon(pokemons_to_delete);
                        getPokemons.insertpokemon(trade_prompt.UserID.User1ID, pokemons_to_add);
                    });
                }
                //#endregion

                user1.save().then(() => {
                    user2.save().then(() => {
                        trade_prompt.remove().then(() => {
                            message.channel.send(`Trade has been confirmed.`);

                            if (user_1_trade_evolutions.length > 0) {
                                var evolved_pokemons = duplicate(user_1_trade_evolutions);
                                var message_string = `<@${trade_prompt.UserID.User2ID}> During this trade,\n`;
                                for (i = 0; i < Object.keys(evolved_pokemons).length; i++) {
                                    var old_pokemon_name = Object.keys(evolved_pokemons)[i].split(",")[0];
                                    var new_pokemon_name = Object.keys(evolved_pokemons)[i].split(",")[1];
                                    message_string += `${evolved_pokemons[Object.keys(evolved_pokemons)[i]]} ${old_pokemon_name} evolved into ${new_pokemon_name}\n`;
                                }
                                message.channel.send(message_string);
                            }

                            if (user_2_trade_evolutions.length > 0) {
                                var evolved_pokemons = duplicate(user_2_trade_evolutions);
                                var message_string = `<@${trade_prompt.UserID.User1ID}> During this trade,\n`;
                                for (i = 0; i < Object.keys(evolved_pokemons).length; i++) {
                                    var old_pokemon_name = Object.keys(evolved_pokemons)[i].split(",")[0];
                                    var new_pokemon_name = Object.keys(evolved_pokemons)[i].split(",")[1];
                                    message_string += `${evolved_pokemons[Object.keys(evolved_pokemons)[i]]} ${old_pokemon_name} evolved into ${new_pokemon_name}\n`;
                                }
                                message.channel.send(message_string);
                            }

                        });
                    });
                });
            });
        });
    })();
}

// Function to recycle pokemon.
function recycle(message, user_prompt, load_pokemons) {

    // Get all user pokemons.
    getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

        var pokemon_to_recycle = user_prompt.Recycle.Pokemons;
        var recycled_exp = pokemon_to_recycle.splice(-1, 1)[0];
        var delete_pokemon_ids = [];

        for (i = 0; i < pokemon_to_recycle.length; i++) {
            delete_pokemon_ids.push(pokemon_to_recycle[i]._id);
        }

        getPokemons.deletepokemon(delete_pokemon_ids).then(() => {
            user_prompt.remove();

            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                //#region Update XP
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_id = selected_pokemon.PokemonId;
                var pokemon_current_xp = selected_pokemon.Experience + recycled_exp;
                var pokemon_level = selected_pokemon.Level;
                if (pokemon_level == 100 || pokemon_level > 100) {
                    var embed = new Discord.MessageEmbed()
                    embed.setTitle(`Successfully recycled ${pokemon_to_recycle.length} pokemons!`)
                    embed.setDescription(`Your Pokémon in max level!`)
                    embed.setColor(message.member.displayHexColor)
                    message.channel.send(embed);
                    return;
                }
                if (selected_pokemon.Held == "Xp blocker") pokemon_current_xp = selected_pokemon.Experience;
                var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, load_pokemons, selected_pokemon.Shiny);

                var old_pokemon_exp = pokemon_current_xp;
                var leveled_up = false;
                var evolved = false;
                var new_evolved_name = "";
                while (pokemon_current_xp > 0) {
                    if (pokemon_current_xp >= exp_to_level(pokemon_level)) {
                        leveled_up = true;

                        //Update level and send message.
                        pokemon_level += 1;
                        pokemon_current_xp -= exp_to_level(pokemon_level);

                        if (pokemon_level == 100) {
                            pokemon_level = 100;
                            pokemon_current_xp = 0;
                            break;
                        }

                        if (selected_pokemon.Held != "Everstone") {

                            // Get pokemon evolution.
                            var pokemon_data = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
                            //Exections for Tyrogue
                            if (pokemon_id == "360" && pokemon_level >= 20) {
                                var ev = 0;
                                let atk = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[1] + _.floor(0.25 * ev)) * pokemon_level) + 5);
                                let def = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[2] + _.floor(0.25 * ev)) * pokemon_level) + 5);

                                if (atk > def) pokemon_id = "140";
                                else if (atk < def) pokemon_id = "141";
                                else pokemon_id = "361";
                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                                evolved = true;
                                new_evolved_name = new_pokemon_name;
                            }
                            // Exception for Cosmoem
                            else if (pokemon_id == "1320" && pokemon_level >= 53) {
                                if (message.channel.name == "day") { evolved = true; pokemon_id = "1321"; }
                                else if (message.channel.name == "night") { evolved = true; pokemon_id = "1322"; }

                                if (evolved) {
                                    var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                                    pokemon_id = pokemon_id;
                                    new_evolved_name = new_pokemon_name;
                                }
                            }
                            else {
                                if (pokemon_data.Evolution != "NULL" && pokemon_data.Evolution.Reason == "Level") {
                                    if (pokemon_level >= pokemon_data.Evolution.Level) {
                                        if (pokemon_data.Evolution.Time == undefined || (pokemon_data.Evolution.Time != undefined && pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase())) {

                                            // Double evolution check.
                                            var double_pokemon_data = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_data.Evolution.Id)[0];

                                            if ((double_pokemon_data.Evolution != "NULL" && double_pokemon_data.Evolution.Reason == "Level" && pokemon_level >= double_pokemon_data.Evolution.Level) && (double_pokemon_data.Evolution.Time == undefined || (double_pokemon_data.Evolution.Time != undefined && double_pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase()))) {
                                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(double_pokemon_data.Evolution.Id, load_pokemons, selected_pokemon.Shiny);
                                                pokemon_id = double_pokemon_data.Evolution.Id;
                                            }
                                            else {
                                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_data.Evolution.Id, load_pokemons, selected_pokemon.Shiny);
                                                pokemon_id = pokemon_data.Evolution.Id;
                                            }
                                            evolved = true;
                                            new_evolved_name = new_pokemon_name;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        break;
                    }
                }

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Experience": pokemon_current_xp, "Pokemons.$[elem].Level": pokemon_level, "Pokemons.$[elem].PokemonId": pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                });
                //#endregion

                var embed = new Discord.MessageEmbed()
                embed.setTitle(`Successfully recycled ${pokemon_to_recycle.length} pokemons!`)
                if (evolved) { embed.addField(`**${old_pokemon_name} evolved to ${new_evolved_name}!**`, `${new_evolved_name} is now level ${pokemon_level}`, false); }
                else if (leveled_up) { embed.addField(`**${old_pokemon_name} levelled up!**`, `${old_pokemon_name} is now level ${pokemon_level}`, false); }
                else { embed.addField(`**${old_pokemon_name} xp increased!**`, `${old_pokemon_name}'s xp is now ${old_pokemon_exp}`, false); }
                embed.setColor(message.member.displayHexColor)
                message.channel.send(embed);
            });
        });
    });
}

// Function to release pokemon.
function release(message, user_prompt) {

    // Get all user pokemons.
    getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

        var pokemon_to_release = user_prompt.Release.Pokemons;
        var new_user_pokemons = user_pokemons.filter(x => !pokemon_to_release.includes(x._id));
        var delete_pokemon_ids = [];
        if (new_user_pokemons.length == 0) { return message.channel.send(`You can't release all pokemons. Spare atleast one.`); }

        for (i = 0; i < pokemon_to_release.length; i++) {
            delete_pokemon_ids.push(pokemon_to_release[i]._id);
        }

        getPokemons.deletepokemon(delete_pokemon_ids).then(() => {
            user_prompt.remove();
            message.channel.send(`Successfully released ${pokemon_to_release.length} pokemons!`);
            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                var selected_pokemon = new_user_pokemons.filter(it => it._id == user.Selected)[0];
                if (selected_pokemon == undefined) {
                    message.channel.send(`You have released your selected pokemon. Pokémon Number 1 selected!`);
                    user.Selected = new_user_pokemons[0]._id;
                    user.save();
                }
            });
        });
    });
}

// Functioon to get duplicate pokemons.
function duplicate(array) {
    const counts = {};
    array.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    return counts;
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
}

module.exports.config = {
    name: "confirm",
    aliases: []
}