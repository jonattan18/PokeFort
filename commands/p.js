const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // For utils

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 2) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to use trade.`); }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }, { "Trade.Accepted": true }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('You are not in a trade!');

        if (args[0].toLowerCase() == "add") return add(bot, message, args.splice(1), pokemons, prompt);
        else if (args[0].toLowerCase() == "remove") return remove(bot, message, args.splice(1), pokemons, prompt);
    });
}

// Function to add pokemons to trade.
function add(bot, message, args, pokemons, prompt) {
    var current_user = 0;
    if (message.author.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_items = prompt.Trade.User1Items == undefined ? [] : prompt.Trade.User1Items;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_items = prompt.Trade.User2Items == undefined ? [] : prompt.Trade.User2Items;
    }

    getPokemons.getallpokemon(message.author.id).then(function (user_pokemons) {

        var trade_pokemons = pokemon_filter(message, args, user_pokemons, pokemons);
        if (trade_pokemons == undefined || trade_pokemons.length == 0) return message.channel.send('Pokemons not found.')
        if ((user_pokemons.length - trade_pokemons.length) == 0) return message.channel.send('You should atleast spare one pokemon.')

        var add_items = trade_pokemons;
        var processed_add_items = [];
        var update_items = [];

        // Update trade menu.
        var temp_add_items = old_items.concat(add_items);
        add_items = temp_add_items.filter((v, i, a) => a.findIndex(t => (JSON.stringify(t) === JSON.stringify(v))) === i);

        for (let i = 0; i < add_items.length; i++) {
            const element = add_items[i];
            processed_add_items.push([get_pokemon_name(pokemons, element.PokemonId, element), element]);
        }

        var new_field = "";
        for (let i = 0; i < processed_add_items.length; i++) {
            const element = processed_add_items[i];
            update_items = _.concat(update_items, element[1]);
            new_field += `${i + 1} | Level ${processed_add_items[i][1].Level} ${element[0]}\n`;
        }

        if ((user_pokemons.length - update_items.length) == 0) return message.channel.send('You should atleast spare one pokemon.')

        if (current_user == 1) prompt.Trade.User1Items = update_items;
        else prompt.Trade.User2Items = update_items;

        prompt.save().then(() => {
            var user1id = prompt.UserID.User1ID;
            var user2id = prompt.UserID.User2ID;

            var user1name = "";
            var user2name = "";
            var extra_msg = "";

            // Extra Messages
            if (current_user == 1) {
                var credits = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
                var redeems = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
                var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
                var num_of_lines = new_field.split(/\r\n|\r|\n/).length
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
            }
            if (current_user == 2) {
                var credits = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
                var redeems = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
                var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
                var num_of_lines = new_field.split(/\r\n|\r|\n/).length
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
            }

            bot.users.fetch(user1id).then(user_data => {
                user1name = user_data.username;

                bot.users.fetch(user2id).then(user_data => {
                    user2name = user_data.username;

                    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
                        var new_embed = message_old.embeds[0];
                        if (current_user == 1) {
                            new_embed.fields[0] = { name: `${user1name}'s is offering`, value: '```' + new_field + extra_msg + '```', inline: false };
                        } else {
                            new_embed.fields[1] = { name: `${user2name}'s is offering`, value: '```' + new_field + extra_msg + '```', inline: false };
                        }
                        message_old.edit(new_embed);
                    }).catch(console.error);
                });
            });
        });
    });
}

// Function to remove pokemons from trade.
function remove(bot, message, args, pokemons, prompt) {
    var current_user = 0;
    if (message.author.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_items = prompt.Trade.User1Items == undefined ? [] : prompt.Trade.User1Items;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_items = prompt.Trade.User2Items == undefined ? [] : prompt.Trade.User2Items;
    }

    getPokemons.getallpokemon(message.author.id).then(function (user_pokemons) {

        var trade_pokemons = pokemon_filter(message, args, user_pokemons, pokemons);
        if (trade_pokemons == undefined || trade_pokemons.length == 0) return message.channel.send('Pokemons not found.')

        var add_items = trade_pokemons;
        var processed_add_items = [];
        var update_items = [];

        // Update trade menu.
        add_items = _.differenceBy(old_items, add_items, JSON.stringify);

        for (let i = 0; i < add_items.length; i++) {
            const element = add_items[i];
            processed_add_items.push([get_pokemon_name(pokemons, element.PokemonId, element), element]);
        }

        var new_field = "";
        if (processed_add_items.length == 0) { new_field = ' ' }
        for (let i = 0; i < processed_add_items.length; i++) {
            const element = processed_add_items[i];
            update_items = _.concat(update_items, element[1]);
            new_field += `${i + 1} | Level ${processed_add_items[i][1].Level} ${element[0]}\n`;
        }

        if (current_user == 1) prompt.Trade.User1Items = update_items;
        else prompt.Trade.User2Items = update_items;

        prompt.save().then(() => {
            var user1id = prompt.UserID.User1ID;
            var user2id = prompt.UserID.User2ID;

            var user1name = "";
            var user2name = "";
            var extra_msg = "";

            // Extra Messages
            if (current_user == 1) {
                var credits = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
                var redeems = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
                var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
                var num_of_lines = new_field.split(/\r\n|\r|\n/).length
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
            }
            if (current_user == 2) {
                var credits = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
                var redeems = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
                var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
                var num_of_lines = new_field.split(/\r\n|\r|\n/).length
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
            }

            bot.users.fetch(user1id).then(user_data => {
                user1name = user_data.username;

                bot.users.fetch(user2id).then(user_data => {
                    user2name = user_data.username;

                    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
                        var new_embed = message_old.embeds[0];
                        if (current_user == 1) {
                            new_embed.fields[0] = { name: `${user1name}'s is offering`, value: '```' + new_field + extra_msg + '```', inline: false };
                        } else {
                            new_embed.fields[1] = { name: `${user2name}'s is offering`, value: '```' + new_field + extra_msg + '```', inline: false };
                        }
                        message_old.edit(new_embed);
                    }).catch(console.error);
                });
            });
        });
    });
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(pokemons, pokemon_id, selected_pokemon) {
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
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
    if (selected_pokemon.Shiny) { pokemon_name = pokemon_name + ' ⭐' }
    return pokemon_name;
}

function pokemon_filter(message, args, user_pokemons, pokemons) {

    if (onlyNumbers(args)) {
        var filtered_pokemons = user_pokemons.filter((_, index) => args.includes((index + 1).toString()));
        return filtered_pokemons;
    }

    // Multi commmand controller.
    var error = [];
    var total_args = args.join(" ").replace(/--/g, ",--").split(",");
    total_args = _.without(total_args, "", " ");
    for (j = 0; j < total_args.length; j++) {
        var is_not = false;
        new_args = total_args[j].split(" ").filter(it => it != "");
        if (new_args[0] == "--not") {
            var old_pokemons = user_pokemons;
            is_not = true;
            new_args.splice(0, 1);
            new_args[0] = "--" + new_args[0];
        }
        error[0] = new_args[0];
        if (new_args.length == 1 && (_.isEqual(new_args[0], "--s") || _.isEqual(new_args[0], "--shiny"))) { shiny(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--l") || _.isEqual(new_args[0], "--legendary"))) { legendary(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--m") || _.isEqual(new_args[0], "--mythical"))) { mythical(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--ub") || _.isEqual(new_args[0], "--ultrabeast"))) { ultrabeast(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--a") || _.isEqual(new_args[0], "--alolan"))) { alolan(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--g") || _.isEqual(new_args[0], "--galarian"))) { galarian(new_args); }
        else if (new_args.length == 1 && (_.isEqual(new_args[0], "--fav") || _.isEqual(new_args[0], "--favourite"))) { favourite(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--t") || _.isEqual(new_args[0], "--type"))) { type(new_args); }
        else if (new_args.length >= 1 && (_.isEqual(new_args[0], "--n") || _.isEqual(new_args[0], "--name"))) { name(new_args); }
        else if (new_args.length >= 1 && (_.isEqual(new_args[0], "--nn") || _.isEqual(new_args[0], "--nickname"))) { nickname(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--lvl") || _.isEqual(new_args[0], "--level"))) { level(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--iv"))) { iv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--hpiv"))) { hpiv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--atkiv") || _.isEqual(new_args[0], "--attackiv"))) { atkiv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--defiv") || _.isEqual(new_args[0], "--defenseiv"))) { defiv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spatkiv") || _.isEqual(new_args[0], "--specialattackiv"))) { spatkiv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spdefiv") || _.isEqual(new_args[0], "--specialdefenseiv"))) { spdefiv(new_args); }
        else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spdiv") || _.isEqual(new_args[0], "--speediv"))) { spdiv(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--limit") || _.isEqual(new_args[0], "--l"))) { limit(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--trip") || _.isEqual(new_args[0], "--triple"))) { triple(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--double"))) { double(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--quad") || _.isEqual(new_args[0], "--quadra"))) { quadra(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--pent") || _.isEqual(new_args[0], "--penta"))) { penta(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--evolution") || _.isEqual(new_args[0], "--e"))) { evolution(new_args); }
        else if (new_args.length == 2 && (_.isEqual(new_args[0], "--order"))) { return order(new_args); }
        else { message.channel.send("Invalid command."); return; }

        // Check if error occurred in previous loop
        if (error.length > 1) {
            message.channel.send(`Error: Argument ${'``' + error[0] + '``'} says ${error[1][1]}`);
            break;
        }
        if (is_not) {
            user_pokemons = old_pokemons.filter(x => !user_pokemons.includes(x));
        }
        if (j == total_args.length - 1) { return user_pokemons; }
    }

    // For pk --shiny command.
    function shiny(args) {
        user_pokemons = user_pokemons.filter(pokemon => pokemon.Shiny);
    }

    // For pk --legendary command.
    function legendary(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId.toString())[0];
            if (pokemon_db["Legendary Type"] === "Legendary" || pokemon_db["Legendary Type"] === "Sub-Legendary" && pokemon_db["Alternate Form Name"] === "NULL" && pokemon_db["Primary Ability"] != "Beast Boost") {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --mythical command.
    function mythical(args) {
        if (args.length == 1 && args[0] == '--mythical' || args[0] == "--m") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                if (pokemon_db["Legendary Type"] === "Mythical" && pokemon_db["Alternate Form Name"] === "NULL") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            user_pokemons = filtered_pokemons;
        }
    }

    // For pk --ultrabeast command.
    function ultrabeast(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
            if (pokemon_db["Primary Ability"] === "Beast Boost" && pokemon_db["Alternate Form Name"] === "NULL") {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --alolan command.
    function alolan(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
            if (pokemon_db["Alternate Form Name"] === "Alola") {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --galarian command.
    function galarian(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
            if (pokemon_db["Alternate Form Name"] === "Galar") {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --favourite command.
    function favourite(args) {
        user_pokemons = user_pokemons.filter(pokemon => pokemon.Favourite === true)
    }

    // For pk --type command.
    function type(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
            if (pokemon_db["Primary Type"].toLowerCase() == args[1].toLowerCase() || pokemon_db["Secondary Type"].toLowerCase() == args[1].toLowerCase()) {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --name command.
    function name(args) {
        var filtered_pokemons = [];
        for (i = 0; i < user_pokemons.length; i++) {
            var user_name = args.slice(1).join(" ").toLowerCase();
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
            if (pokemon_db["Pokemon Name"].toLowerCase() == user_name) {
                filtered_pokemons.push(user_pokemons[i]);
            }
        }
        user_pokemons = filtered_pokemons;
    }

    // For pk --nickname command.
    function nickname(args) {
        if (args.length == 1) {
            user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname != "");
        } else {
            args = args.slice(1);
            user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname != undefined && pokemon.Nickname.toLowerCase() === args.join(" ").toLowerCase());
        }
    }

    // For pk --level command.
    function level(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --iv command.
    function iv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1]) || isFloat(parseFloat(args[1]))) {
            filtered_pokemons = user_pokemons.filter(pokemon => total_iv(pokemon.IV) == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
            filtered_pokemons = user_pokemons.filter(pokemon => parseFloat(total_iv(pokemon.IV)) > parseFloat(args[2]));
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
            filtered_pokemons = user_pokemons.filter(pokemon => parseFloat(total_iv(pokemon.IV)) < parseFloat(args[2]));
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --hpiv command.
    function hpiv() {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --atkiv command.
    function atkiv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --defiv command.
    function defiv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --spatkiv command.
    function spatkiv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --spdefiv command.
    function spdefiv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --speediv command.
    function spdiv(args) {
        var filtered_pokemons = [];
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] == args[1]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] > args[2]);
            user_pokemons = filtered_pokemons;
        }
        else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
            filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] < args[2]);
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --limit command.
    function limit(args) {
        if (args.length == 1) {
            return error[1] = [false, "Please specify a value."]
        }
        else if (args.length == 2 && isInt(args[1])) {
            user_pokemons = user_pokemons.slice(0, args[1]);
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --triple command.
    function triple(args) {
        if (parseInt(args[1]) == 31 || parseInt(args[1]) == 0) {
            var filtered_pokemons = [];
            filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 3, args[1]));
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --quadra command.
    function quadra(args) {
        if (parseInt(args[1]) == 31 || parseInt(args[1]) == 0) {
            var filtered_pokemons = [];
            filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 4, args[1]));
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --penta command.
    function penta(args) {
        if (parseInt(args[1]) == 31 || parseInt(args[1]) == 0) {
            var filtered_pokemons = [];
            filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 5, args[1]));
            user_pokemons = filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }

    // For pk --order command.
    function order(args) {
        var order_type = "";
        if (args[1].toLowerCase() == "iv") { order_type = "IV"; }
        else if (args[1].toLowerCase() == "level") { order_type = "Level"; }
        else if (args[1].toLowerCase() == "alphabet") { order_type = "Alphabet"; }
        else if (args[1].toLowerCase() == "number") { order_type = "Number"; }

        user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { OrderType: order_type } }, { new: true }, (err, doc) => {
            if (err) return console.log(err);
            return message.channel.send("Pokemon Order updated.");
        });
    }

    // For pk --evolution command.
    function evolution(args) {
        var filtered_pokemons = [];
        if (args.length == 2) {
            var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Name"].toLowerCase() == args[1].toLowerCase())[0];
            if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
            filtered_pokemons.push(found_pokemon["Pokemon Id"]);

            var pre_evolution = pokemons.filter(it => it["Pokemon Id"] === found_pokemon["Pre-Evolution Pokemon Id"].toString())[0];
            if (pre_evolution) filtered_pokemons.push(pre_evolution["Pokemon Id"]);

            var pre_pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
            if (pre_pre_evolution) filtered_pokemons.push(pre_pre_evolution["Pokemon Id"]);

            if (pre_evolution) var post_evolution = pokemons.filter(it => it["Pokemon Id"] === pre_evolution["Pre-Evolution Pokemon Id"].toString())[0];
            if (post_evolution) filtered_pokemons.push(post_evolution["Pokemon Id"]);

            if (pre_pre_evolution) var post_post_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pre_pre_evolution["Pokemon Id"]))[0];
            if (post_post_evolution) filtered_pokemons.push(post_post_evolution["Pokemon Id"]);

            duo_filtered_pokemons = user_pokemons.filter(pokemon => filtered_pokemons.includes(pokemon["PokemonId"]));
            user_pokemons = duo_filtered_pokemons;
        }
        else { return error[1] = [false, "Invalid argument syntax."] }
    }
}

function onlyNumbers(array) {
    return array.every(element => {
        return !isNaN(element);
    });
}

// Check if given value is float.
function isFloat(x) { return !!(x % 1); }

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

// Check if any value has repeated number of times.
function has_repeated(array, times, number) {
    const counts = {};
    var array_counts = [];
    array.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    for (i = 0; i < Object.keys(counts).length; i++) {
        if (Object.keys(counts)[i] === number && counts[Object.keys(counts)[i]] == times) {
            array_counts.push(Object.keys(counts)[i]);
        }
    }
    if (array_counts.length > 0) { return true; }
    else { return false; }
}

function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

module.exports.config = {
    name: "p",
    aliases: []
}