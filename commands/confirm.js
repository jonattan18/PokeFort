const Discord = require('discord.js'); // For message embed.
const _ = require('lodash'); // for utils
const mongoose = require('mongoose');

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``confirm`` command.');

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
            return trade(message, prompt);
        }

        else return message.channel.send('No prompt asked for to use ``confirm`` command.');

    });
}

// Function to trade pokemon.
function trade(message, trade_prompt) {
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
                    change_trade(message, trade_prompt);
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
                    change_trade(message, trade_prompt);
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
function change_trade(message, trade_prompt) {
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

                // For user 1
                if (user_1_items.length > 0) {
                    getPokemons.getallpokemon(trade_prompt.UserID.User1ID).then(function (user_pokemons) {

                        var pokemons_to_add = [];
                        var pokemons_to_delete = [];
                        for (i = 0; i < user_1_items.length; i++) {
                            var user_pokemon_to_add = user_pokemons.filter(pokemon => JSON.stringify(pokemon) == JSON.stringify(user_1_items[i]))[0];
                            if (user_pokemon_to_add != undefined) {
                                user_pokemon_to_add.Reason = "Traded";
                                pokemons_to_delete.push(user_pokemon_to_add._id);
                                pokemons_to_add.push(user_pokemon_to_add);
                            }
                        }

                        var selected_pokemon = pokemons_to_delete.filter(it => it._id == user1.Selected)[0];
                        if (selected_pokemon != undefined) {
                            var current_pokemon = _.differenceBy(user_pokemons, pokemons_to_delete, '_id')
                            user_model.findOneAndUpdate({ UserID: trade_prompt.UserID.User1ID }, { $set: { Selected: current_pokemon[0]._id } }, (err, result) => {
                                if (err) console.log(err)
                                message.channel.send(`You have released your selected pokemon. Pokemon Number 1 selected!`);
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
                                pokemons_to_delete.push(user_pokemon_to_add._id);
                                pokemons_to_add.push(user_pokemon_to_add);
                            }
                        }

                        var selected_pokemon = pokemons_to_delete.filter(it => it._id == user2.Selected)[0];
                        if (selected_pokemon != undefined) {
                            var current_pokemon = _.differenceBy(user_pokemons, pokemons_to_delete, '_id')
                            user_model.findOneAndUpdate({ UserID: trade_prompt.UserID.User2ID }, { $set: { Selected: current_pokemon[0]._id } }, (err, result) => {
                                if (err) console.log(err)
                                message.channel.send(`You have released your selected pokemon. Pokemon Number 1 selected!`);
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
                var old_pokemon_name = get_pokemon_name(load_pokemons, pokemon_id, selected_pokemon);

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

                        // Get pokemon evolution.
                        var evo_tree = evolution_tree(load_pokemons, pokemon_id);
                        var next_evolutions = evo_tree.filter(it => it[0] > pokemon_id && it[1].includes('Level'));
                        if (next_evolutions != undefined && next_evolutions.length > 0) {
                            next_evolutions = next_evolutions[0];
                            var required_level = next_evolutions[1].match(/\d/g).join("");
                            if (pokemon_level >= required_level) {
                                var new_pokemon_name = get_pokemon_name(load_pokemons, next_evolutions[0], selected_pokemon, true);
                                pokemon_id = next_evolutions[0];
                                evolved = true;
                                new_evolved_name = new_pokemon_name;
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
                    message.channel.send(`You have released your selected pokemon. Pokemon Number 1 selected!`);
                    user.Selected = new_user_pokemons[0]._id;
                    user.save();
                }
            });
        });
    });
}

// Get evolution tree of pokemons.
function evolution_tree(pokemons, pokemon_id) {
    var filtered_pokemons = [];
    var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Id"] == pokemon_id)[0];
    if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
    filtered_pokemons.push(parseInt(found_pokemon["Pokemon Id"]));

    var pre_evolution = pokemons.filter(it => it["Pokemon Id"] === found_pokemon["Pre-Evolution Pokemon Id"].toString())[0];
    if (pre_evolution) filtered_pokemons.push([parseInt(pre_evolution["Pokemon Id"]), pre_evolution["Evolution Details"]]);

    var pre_pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
    if (pre_pre_evolution) filtered_pokemons.push([parseInt(pre_pre_evolution["Pokemon Id"]), pre_pre_evolution["Evolution Details"]]);

    if (pre_evolution) var post_evolution = pokemons.filter(it => it["Pokemon Id"] === pre_evolution["Pre-Evolution Pokemon Id"].toString())[0];
    if (post_evolution) filtered_pokemons.push([parseInt(post_evolution["Pokemon Id"]), post_evolution["Evolution Details"]]);

    if (pre_pre_evolution) var post_post_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pre_pre_evolution["Pokemon Id"]))[0];
    if (post_post_evolution) filtered_pokemons.push([parseInt(post_post_evolution["Pokemon Id"]), post_post_evolution["Evolution Details"]]);

    return filtered_pokemons;
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(load_pokemons, pokemon_id, selected_pokemon, star_shiny = false) {
    var pokemon_db = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
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
    if (selected_pokemon.Shiny) { if (star_shiny) { pokemon_name = ':star: ' + pokemon_name; } else { pokemon_name = 'Shiny ' + pokemon_name; } }
    return pokemon_name;
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
}

module.exports.config = {
    name: "confirm",
    aliases: []
}