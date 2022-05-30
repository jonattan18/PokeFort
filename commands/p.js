const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // For utils

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

// Config
const config = require('../config/config.json');

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
            processed_add_items.push([getPokemons.get_pokemon_name_from_id(element.PokemonId, pokemons, element.Shiny), element]);
        }

        if (current_user == 1) {
            prompt.Trade.User2IConfirm = false;
            if ((processed_add_items.length + prompt.Trade.User2Items.length) > config.TRADE_POKEMON_MAX_LIMIT) {
                processed_add_items.splice(-((processed_add_items.length + prompt.Trade.User2Items.length) - config.TRADE_POKEMON_MAX_LIMIT));
                message.channel.send(`You can't add more than ${config.TRADE_POKEMON_MAX_LIMIT} pokemons.`);
            }
        }
        else {
            prompt.Trade.User1IConfirm = false;
            if ((processed_add_items.length + prompt.Trade.User1Items.length) > config.TRADE_POKEMON_MAX_LIMIT) {
                processed_add_items.splice(-((processed_add_items.length + prompt.Trade.User1Items.length) - config.TRADE_POKEMON_MAX_LIMIT));
                message.channel.send(`You can't add more than ${config.TRADE_POKEMON_MAX_LIMIT} pokemons.`);
            }
        }

        var new_field = [];
        var last_num = 0;
        var number_of_chunks = config.TRADE_POKEMON_PER_PAGE;
        var chunked_array = chunkArray(processed_add_items, number_of_chunks);
        for (let j = 0; j < chunked_array.length; j++) {
            for (let i = 0; i < chunked_array[j].length; i++) {
                const element = chunked_array[j][i];
                update_items = _.concat(update_items, element[1]);
                if (new_field[j] == undefined) { new_field[j] = ""; }
                new_field[j] += `${number_of_chunks * j + i + 1} | Level ${chunked_array[j][i][1].Level} ${element[0]}\n`;
                last_num = number_of_chunks * j + i + 1;
            }
        }

        if ((user_pokemons.length - update_items.length) == 0) return message.channel.send('You should atleast spare one pokemon.')

        if (current_user == 1) prompt.Trade.User1Items = update_items;
        else prompt.Trade.User2Items = update_items;

        prompt.save().then(() => {
            var user1id = prompt.UserID.User1ID;
            var user2id = prompt.UserID.User2ID;

            var user1name = "";
            var user2name = "";
            var tag1 = "";
            var tag2 = "";
            var extra_msg = "";

            // Extra Messages
            if (current_user == 1) {
                var credits = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
                var redeems = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
                var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
                var num_of_lines = last_num + 1;
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
                if (new_field.length == 0) { new_field[0] = "\t" + extra_msg; }
                else new_field[new_field.length - 1] += extra_msg;
            }
            if (current_user == 2) {
                var credits = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
                var redeems = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
                var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
                var num_of_lines = last_num + 1;
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
                if (new_field.length == 0) { new_field[0] = "\t" + extra_msg; }
                else new_field[new_field.length - 1] += extra_msg;
            }

            bot.users.fetch(user1id).then(user_data => {
                user1name = user_data.username;
                tag1 = user_data.discriminator;

                bot.users.fetch(user2id).then(user_data => {
                    user2name = user_data.username;
                    tag2 = user_data.discriminator;

                    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
                        var new_embed = message_old.embeds[0];
                        if (current_user == 1) {
                            if (new_field.length > 0) {
                                var opp_user_fields = [];
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user2name + '#' + tag2)) {
                                        opp_user_fields.push(new_embed.fields[i]);
                                    }
                                }
                                for (i = 0; i < new_field.length; i++) {
                                    new_embed.fields[i] = { name: `${user1name + '#' + tag1}'s is offering`, value: '```' + new_field[i] + '```', inline: false };
                                }
                                for (i = 0; i < opp_user_fields.length; i++) {
                                    new_embed.fields[new_field.length + i] = { name: opp_user_fields[i].name, value: opp_user_fields[i].value, inline: false };
                                }
                                new_embed.fields[new_embed.fields.length - 1].name = (new_embed.fields[new_embed.fields.length - 1].name).replace(' | :white_check_mark:', '');
                            }
                            // Check for empty fields.
                            for (i = 0; i < new_embed.fields.length; i++) {
                                if (new_embed.fields[i].name.includes(user1name + '#' + tag1) && new_embed.fields[i].value == '``` ```') {
                                    new_embed.fields.splice(i, 1);
                                }
                            }
                        } else {
                            if (new_field.length > 0) {
                                var opp_user_fields = [];
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user1name)) {
                                        opp_user_fields.push(new_embed.fields[i]);
                                    }
                                }
                                for (i = 0; i < new_field.length; i++) {
                                    new_embed.fields[opp_user_fields.length + i] = { name: `${user2name + '#' + tag2}'s is offering`, value: '```' + new_field[i] + '```', inline: false };
                                }
                                new_embed.fields[0].name = (new_embed.fields[0].name).replace(' | :white_check_mark:', '');
                            }
                            // Check for empty fields.
                            for (i = 0; i < new_embed.fields.length; i++) {
                                if (new_embed.fields[i].name.includes(user2name + '#' + tag2) && new_embed.fields[i].value == '``` ```') {
                                    new_embed.fields.splice(i, 1);
                                }
                            }
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
            processed_add_items.push([getPokemons.get_pokemon_name_from_id(element.PokemonId, pokemons, element.Shiny), element]);
        }

        var new_field = [];
        var last_num = 0;
        var number_of_chunks = config.TRADE_POKEMON_PER_PAGE;
        var chunked_array = chunkArray(processed_add_items, number_of_chunks);
        for (let j = 0; j < chunked_array.length; j++) {
            for (let i = 0; i < chunked_array[j].length; i++) {
                const element = chunked_array[j][i];
                update_items = _.concat(update_items, element[1]);
                if (new_field[j] == undefined) { new_field[j] = ""; }
                new_field[j] += `${number_of_chunks * j + i + 1} | Level ${chunked_array[j][i][1].Level} ${element[0]}\n`;
                last_num = number_of_chunks * j + i + 1;
            }
        }

        if (current_user == 1) {
            prompt.Trade.User2IConfirm = false;
            prompt.Trade.User1Items = update_items;
        }
        else {
            prompt.Trade.User1IConfirm = false;
            prompt.Trade.User2Items = update_items;
        }

        prompt.save().then(() => {
            var user1id = prompt.UserID.User1ID;
            var user2id = prompt.UserID.User2ID;

            var user1name = "";
            var user2name = "";
            var tag1 = "";
            var tag2 = "";
            var extra_msg = "";

            // Extra Messages
            if (current_user == 1) {
                var credits = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
                var redeems = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
                var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
                var num_of_lines = last_num + 1;
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
                if (new_field[new_field.length] == undefined) { new_field[new_field.length] = " " + extra_msg; }
                else new_field[new_field.length - 1] += extra_msg;
            }
            if (current_user == 2) {
                var credits = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
                var redeems = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
                var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
                var num_of_lines = last_num + 1;
                if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
                if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
                if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
                if (new_field[new_field.length] == undefined) { new_field[new_field.length] = "\t" + extra_msg; }
                else new_field[new_field.length - 1] += extra_msg;
            }

            bot.users.fetch(user1id).then(user_data => {
                user1name = user_data.username;
                tag1 = user_data.discriminator;

                bot.users.fetch(user2id).then(user_data => {
                    user2name = user_data.username;
                    tag2 = user_data.discriminator;

                    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
                        var new_embed = message_old.embeds[0];
                        if (current_user == 1) {
                            if (new_field.length > 0) {
                                var opp_user_fields = [];
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user2name + '#' + tag2)) {
                                        opp_user_fields.push(new_embed.fields[i]);
                                    }
                                }
                                for (i = 0; i < new_field.length; i++) {
                                    new_embed.fields[i] = { name: `${user1name + '#' + tag1}'s is offering`, value: '```' + new_field[i] + '```', inline: false };
                                }
                                for (i = 0; i < opp_user_fields.length; i++) {
                                    new_embed.fields[new_field.length + i] = { name: opp_user_fields[i].name, value: opp_user_fields[i].value, inline: false };
                                }
                                new_embed.fields[new_embed.fields.length - 1].name = (new_embed.fields[new_embed.fields.length - 1].name).replace(' | :white_check_mark:', '');
                                // Check for empty fields.
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user2name + '#' + tag2) && new_embed.fields[i].value == '``` ```') {
                                        new_embed.fields.splice(i, 1);
                                    }
                                }
                            }
                        } else {
                            if (new_field.length > 0) {
                                var opp_user_fields = [];
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user1name)) {
                                        opp_user_fields.push(new_embed.fields[i]);
                                    }
                                    else new_embed.fields.splice(i, 1);
                                }
                                for (i = 0; i < new_field.length; i++) {
                                    new_embed.fields[opp_user_fields.length + i] = { name: `${user2name + '#' + tag2}'s is offering`, value: '```' + new_field[i] + '```', inline: false };
                                }
                                new_embed.fields[0].name = (new_embed.fields[0].name).replace(' | :white_check_mark:', '');
                                // Check for empty fields.
                                for (i = 0; i < new_embed.fields.length; i++) {
                                    if (new_embed.fields[i].name.includes(user2name + '#' + tag2) && new_embed.fields[i].value == '``` ```') {
                                        new_embed.fields.splice(i, 1);
                                    }
                                }
                            }
                        }
                        message_old.edit(new_embed);
                    }).catch(console.error);
                });
            });
        });
    });
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