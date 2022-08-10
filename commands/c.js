const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // For utils

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "ChannelID": interaction.channel.id }, { "Trade.Accepted": true }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return interaction.reply({ content: 'You are not in a trade!', ephemeral: true });

        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            if (interaction.options.getSubcommand() === "add") return add(interaction, prompt, user);
            else if (interaction.options.getSubcommand() === "remove") return remove(interaction, prompt);
        });
    });
}

// Function to add pokemons to trade.
function add(interaction, prompt, user_data) {
    var current_user = 0;
    if (interaction.user.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) return interaction.reply({ content: 'You already confirmed your trade.', ephemeral: true });
        var old_credit = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) return interaction.reply({ content: 'You already confirmed your trade.', ephemeral: true });
        var old_credit = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
    }

    var amount = interaction.options.get("amount").value;
    if (amount < 1) return interaction.reply({ content: 'Invalid Amount!', ephemeral: true });

    var new_credit = old_credit + amount;

    if (new_credit > user_data.PokeCredits) return interaction.reply({ content: 'You do not have enough credits!', ephemeral: true });

    if (current_user == 1) {
        prompt.Trade.User2IConfirm = false;
        prompt.Trade.Credits.User1 = new_credit;
        prompt.save();
    } else {
        prompt.Trade.User1IConfirm = false;
        prompt.Trade.Credits.User2 = new_credit;
        prompt.save();
    }

    interaction.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
        var new_embed = message_old.embeds[0];
        if (current_user == 1) {
            var user_items = prompt.Trade.User1Items;
            var last_index = parseInt((user_items.length - 1) / config.TRADE_POKEMON_PER_PAGE);
            var msg = get_message(current_user, prompt, new_embed.fields[last_index].value, new_credit);
            new_embed.fields[new_embed.fields.length - 1].name = (new_embed.fields[new_embed.fields.length - 1].name).replace(' | :white_check_mark:', '');
            new_embed.fields[last_index].value = '```' + msg + '```';
        } else {
            var msg = get_message(current_user, prompt, new_embed.fields[new_embed.fields.length - 1].value, new_credit);
            new_embed.fields[0].name = (new_embed.fields[0].name).replace(' | :white_check_mark:', '');
            new_embed.fields[new_embed.fields.length - 1].value = '```' + msg + '```';
        }
        message_old.edit(new_embed);
    }).catch(console.error);
}

// Function to remove credits from trade.
function remove(interaction, prompt) {
    var current_user = 0;
    if (interaction.user.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) return interaction.reply({ content: 'You already confirmed your trade.', ephemeral: true });
        var old_credit = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) return interaction.reply({ content: 'You already confirmed your trade.', ephemeral: true });
        var old_credit = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
    }

    var amount = interaction.options.get("amount").value;
    if (amount < 1) return interaction.reply({ content: 'Invalid Amount!', ephemeral: true });

    var new_credit = old_credit - amount;

    if (new_credit < 0) return interaction.reply({ content: 'Invalid amount to remove!', ephemeral: true });

    if (current_user == 1) {
        prompt.Trade.User2IConfirm = false;
        prompt.Trade.Credits.User1 = new_credit;
        prompt.save();
    } else {
        prompt.Trade.User1IConfirm = false;
        prompt.Trade.Credits.User2 = new_credit;
        prompt.save();
    }

    interaction.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
        var new_embed = message_old.embeds[0];
        if (current_user == 1) {
            var user_items = prompt.Trade.User1Items;
            var last_index = parseInt((user_items.length - 1) / config.TRADE_POKEMON_PER_PAGE);
            var msg = get_message(current_user, prompt, new_embed.fields[last_index].value, new_credit);
            new_embed.fields[new_embed.fields.length - 1].name = (new_embed.fields[new_embed.fields.length - 1].name).replace(' | :white_check_mark:', '');
            new_embed.fields[last_index].value = '```' + msg + '```';
        } else {
            var msg = get_message(current_user, prompt, new_embed.fields[new_embed.fields.length - 1].value, new_credit);
            new_embed.fields[0].name = (new_embed.fields[0].name).replace(' | :white_check_mark:', '');
            new_embed.fields[new_embed.fields.length - 1].value = '```' + msg + '```';
        }
        message_old.edit(new_embed);
    }).catch(console.error);

}

// Function to create message trade and add new elements.
function get_message(current_user, prompt, embed_field, new_credit) {

    embed_field = embed_field.replace(/```/g, '');
    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Credits") == -1;
    }).join('\n').replace(/```/g, '');

    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Redeems") == -1;
    }).join('\n').replace(/```/g, '');

    embed_field = embed_field.split('\n').filter(function (line) {
        return line.indexOf("Shards") == -1;
    }).join('\n').replace(/```/g, '');

    var extra_msg = "";
    if (current_user == 1) {
        var redeems = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
        var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
        var line_counter = prompt.Trade.User1Items.length + 1;
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Credits\n`; line_counter++; }
        if (redeems > 0) { extra_msg += `${line_counter} | ${redeems} Redeems\n`; line_counter++; }
        if (shards > 0) { extra_msg += `${line_counter} | ${shards} Shards\n`; line_counter++; }
    }
    if (current_user == 2) {
        var redeems = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
        var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
        var line_counter = prompt.Trade.User2Items.length + 1;
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Credits\n`; line_counter++; }
        if (redeems > 0) { extra_msg += `${line_counter} | ${redeems} Redeems\n`; line_counter++; }
        if (shards > 0) { extra_msg += `${line_counter} | ${shards} Shards\n`; line_counter++; }
    }

    return embed_field + extra_msg;
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "c",
    description: "Trade credits.",
    options: [{
        name: "add",
        description: "Add credits to trade.",
        type: 1,
        options: [{
            name: "amount",
            description: "Amount of credits to add.",
            type: 4,
            required: true,
            min_value: 1
        }]
    }, {
        name: "remove",
        description: "Remove credits from trade.",
        type: 1,
        options: [{
            name: "amount",
            description: "Amount of credits to remove.",
            type: 4,
            required: true,
            min_value: 1
        }]
    }],
    aliases: []
}