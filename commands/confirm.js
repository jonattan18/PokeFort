const Discord = require('discord.js'); // For message embed.
const fs = require('fs'); // To read file.

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            var user_prompt = channel.Prompt;
            if (user_prompt.UserID != message.author.id) { message.channel.send('No prompt asked for to use ``confirm`` command.'); return; }
            if (user_prompt.Reason == "Release") { release(message, user_prompt, user); return; }
            if (user_prompt.Reason == "Recycle") { recycle(message, user_prompt, user, pokemons); return; }

        });
    });
}

// Function to recycle pokemon.
function recycle(message, user_prompt, user, load_pokemons) {

    var pokemon_to_recycle = user_prompt.Pokemons;
    var user_pokemons = user.Pokemons;
    var recycled_pokemons = user.Recycled;

    var old_date = user_prompt.Timestamp;
    var current_date = Date.now();

    var recycled_exp = pokemon_to_recycle.splice(-1, 1)[0];

    if ((current_date - old_date) / 1000 > 120) {
        message.channel.send(`Too late to recycle pokemon. Pokemon Spared!`);
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);
        });
        return;
    }

    var temp_recycled_pokemons = user_pokemons.filter(x => pokemon_to_recycle.includes(x._id));
    var new_recycled_pokemons = recycled_pokemons.concat(temp_recycled_pokemons);
    var new_user_pokemons = user_pokemons.filter(x => !pokemon_to_recycle.includes(x._id));

    user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons": new_user_pokemons, "Recycled": new_recycled_pokemons } }, (err, user) => {
        if (err) console.log(err);
        if (!user) return;

        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);

            //#region Update XP
            var user_pokemons = user.Pokemons;
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
            user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons.$[el].Experience": pokemon_current_xp, "Pokemons.$[el].Level": pokemon_level, "Pokemons.$[el].PokemonId": pokemon_id } }, {
                arrayFilters: [{ "el._id": _id }],
                new: true
            }, (err, user) => {
                if (err) { console.log(err) }
            });

            //#endregion

            var embed = new Discord.MessageEmbed()
            embed.setTitle(`Successfully recycled ${pokemon_to_recycle.length} pokemons!`)
            if (evolved) { embed.addField(`**${old_pokemon_name} evolved to ${new_evolved_name}!**`, `${new_evolved_name} is now level ${pokemon_level}`, false); }
            else if (leveled_up) { embed.addField(`**${old_pokemon_name} levelled up!**`, `${old_pokemon_name} is now level ${pokemon_level}`, false); }
            else { embed.addField(`**${old_pokemon_name} experience increased!**`, `${old_pokemon_name}'s experience is increased by ${old_pokemon_exp}`, false); }
            embed.setColor(message.member.displayHexColor)
            message.channel.send(embed);
        });
    });
}

// Function to release pokemon.
function release(message, user_prompt, user) {

    var pokemon_to_release = user_prompt.Pokemons;
    var user_pokemons = user.Pokemons;
    var released_pokemons = user.Released;

    var old_date = user_prompt.Timestamp;
    var current_date = Date.now();

    if ((current_date - old_date) / 1000 > 120) {
        message.channel.send(`Too late to release pokemon. Pokemon Spared!`);
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);
        });
        return;
    }

    var temp_released_pokemons = user_pokemons.filter(x => pokemon_to_release.includes(x._id));
    var new_released_pokemons = released_pokemons.concat(temp_released_pokemons);
    var new_user_pokemons = user_pokemons.filter(x => !pokemon_to_release.includes(x._id));

    if (new_user_pokemons.length == 0) { message.channel.send(`You can't release all pokemons. Spare atleast one.`); return; }

    user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons": new_user_pokemons, "Released": new_released_pokemons } }, (err, user) => {
        if (err) console.log(err);
        if (!user) return;

        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);

            message.channel.send(`Successfully released ${temp_released_pokemons.length} pokemons!`);
            var selected_pokemon = new_user_pokemons.filter(it => it._id == user.Selected)[0];
            if (selected_pokemon == undefined) {
                message.channel.send(`You have released your selected pokemon. Pokemon Number 1 selected!`);
                user.Selected = new_user_pokemons[0]._id;
                user.save();
            }
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