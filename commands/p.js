const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // For utils

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length < 2) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to use trade.`); }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            if (channel.AcceptPrompt == undefined) { message.channel.send('There is no trade offer started.'); return; }
            if ((Date.now() - channel.Trade.Timestamp) / 1000 > 120) { message.channel.send('Trade time expired.'); return; }
            if (channel.AcceptPrompt == "Trade" && channel.Trade.Accepted == true && (channel.Trade.User1ID == message.author.id || channel.Trade.User2ID == message.author.id)) {
                if (args[0].toLowerCase() == "add") return add(bot, message, args.splice(1), pokemons, channel, user);
                else if (args[0].toLowerCase() == "remove") return remove(bot, message, args.splice(1), pokemons, channel, user);
            }
            else {
                message.channel.send('You are not in any trade offer.');
                return;
            }

        });
    });
}

// Function to add pokemons to trade.
function add(bot, message, args, pokemons, channel_data, user_data) {
    var current_user = 0;
    if (message.author.id == channel_data.Trade.User1ID) {
        current_user = 1;
        var old_items = channel_data.Trade.User1Items == undefined ? [] : channel_data.Trade.User1Items;
    } else {
        current_user = 2;
        var old_items = channel_data.Trade.User2Items == undefined ? [] : channel_data.Trade.User2Items;
    }
    var user_pokemons = user_data.Pokemons;
    var add_items = [];
    var processed_add_items = [];
    var update_items = [];

    // For only add int type command
    if (onlyNumbers(args)) {
        user_pokemons = user_pokemons.filter((_, index) => args.includes((index + 1).toString()));
        add_items.push(user_pokemons);
        add_items = add_items[0];
    }
    else {
        return message.channel.send(`Invalid Pokemon. Please recheck your syntax.`);
    }

    // Update trade menu.
    var temp_add_items = old_items.concat(add_items);
    add_items = temp_add_items.filter((v, i, a) => a.findIndex(t => (JSON.stringify(t) === JSON.stringify(v))) === i);

    if (add_items.length == 0 || add_items == undefined) { return message.channel.send(`You don't have any pokemon to add.`); }

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

    if (current_user == 1) {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.User1Items": update_items } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    } else {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.User2Items": update_items } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    }

    var user1id = channel_data.Trade.User1ID;
    var user2id = channel_data.Trade.User2ID;

    var user1name = "";
    var user2name = "";

    var extra_msg = "";

    // Extra Messages
    if (current_user == 1) {
        var credits = channel_data.Trade.Credits.User1 == undefined ? 0 : channel_data.Trade.Credits.User1;
        var redeems = channel_data.Trade.Redeems.User1 == undefined ? 0 : channel_data.Trade.Redeems.User1;
        var shards = channel_data.Trade.Shards.User1 == undefined ? 0 : channel_data.Trade.Shards.User1;
        var num_of_lines = new_field.split(/\r\n|\r|\n/).length
        if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
        if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
        if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
    }
    if (current_user == 2) {
        var credits = channel_data.Trade.Credits.User2 == undefined ? 0 : channel_data.Trade.Credits.User2;
        var redeems = channel_data.Trade.Redeems.User2 == undefined ? 0 : channel_data.Trade.Redeems.User2;
        var shards = channel_data.Trade.Shards.User2 == undefined ? 0 : channel_data.Trade.Shards.User2;
        var num_of_lines = new_field.split(/\r\n|\r|\n/).length
        if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
        if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
        if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
    }

    bot.users.fetch(user1id).then(user_data => {
        user1name = user_data.username;

        bot.users.fetch(user2id).then(user_data => {
            user2name = user_data.username;

            message.channel.messages.fetch(channel_data.Trade.MessageID).then(message_old => {
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
}

// Function to remove pokemons from trade.
function remove(bot, message, args, pokemons, channel_data, user_data) {
    var current_user = 0;
    if (message.author.id == channel_data.Trade.User1ID) {
        current_user = 1;
        var old_items = channel_data.Trade.User1Items == undefined ? [] : channel_data.Trade.User1Items;
    } else {
        current_user = 2;
        var old_items = channel_data.Trade.User2Items == undefined ? [] : channel_data.Trade.User2Items;
    }
    var user_pokemons = user_data.Pokemons;
    var add_items = [];
    var processed_add_items = [];
    var update_items = [];

    // For only add int type command
    if (onlyNumbers(args)) {
        user_pokemons = user_pokemons.filter((_, index) => args.includes((index + 1).toString()));
        add_items.push(user_pokemons);
        add_items = add_items[0];
    }
    else {
        return message.channel.send(`Invalid Pokemon. Please recheck your syntax.`);
    }

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

    if (current_user == 1) {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.User1Items": update_items } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    } else {
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Trade.User2Items": update_items } }, { upsert: true }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
        });
    }

    var user1id = channel_data.Trade.User1ID;
    var user2id = channel_data.Trade.User2ID;

    var user1name = "";
    var user2name = "";

    var extra_msg = "";

    // Extra Messages
    if (current_user == 1) {
        var credits = channel_data.Trade.Credits.User1 == undefined ? 0 : channel_data.Trade.Credits.User1;
        var redeems = channel_data.Trade.Redeems.User1 == undefined ? 0 : channel_data.Trade.Redeems.User1;
        var shards = channel_data.Trade.Shards.User1 == undefined ? 0 : channel_data.Trade.Shards.User1;
        var num_of_lines = new_field.split(/\r\n|\r|\n/).length
        if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
        if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
        if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
    }
    if (current_user == 2) {
        var credits = channel_data.Trade.Credits.User2 == undefined ? 0 : channel_data.Trade.Credits.User2;
        var redeems = channel_data.Trade.Redeems.User2 == undefined ? 0 : channel_data.Trade.Redeems.User2;
        var shards = channel_data.Trade.Shards.User2 == undefined ? 0 : channel_data.Trade.Shards.User2;
        var num_of_lines = new_field.split(/\r\n|\r|\n/).length
        if (credits > 0) { extra_msg += `${num_of_lines} | ${credits} Credits\n`; num_of_lines++; }
        if (redeems > 0) { extra_msg += `${num_of_lines} | ${redeems} Redeems\n`; num_of_lines++; }
        if (shards > 0) { extra_msg += `${num_of_lines} | ${shards} Shards\n`; num_of_lines++; }
    }

    bot.users.fetch(user1id).then(user_data => {
        user1name = user_data.username;

        bot.users.fetch(user2id).then(user_data => {
            user2name = user_data.username;

            message.channel.messages.fetch(channel_data.Trade.MessageID).then(message_old => {
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

function onlyNumbers(array) {
    return array.every(element => {
        return !isNaN(element);
    });
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