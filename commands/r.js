// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    // Raid check
    var raid_cmds = ["spawn", "start", "join", "leave", "kick", "ban", "info"];
    if (raid_cmds.includes(args[0].toLowerCase())) {
        const commandfile = bot.commands.get("raid") || client.commands.get(client.aliases.get("raid"));
        if (!commandfile) return message.channel.send(`Invalid Command.`);
        return commandfile.run(bot, message, args, prefix, user_available, pokemons);
    }
    else {
        if (args.length < 2) { return message.channel.send(`Invalid Command.`); }

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }, { "Trade.Accepted": true }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return message.channel.send('You are not in a trade!');

            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                if (!user) return;
                if (err) console.log(err);

                if (args[0].toLowerCase() == "add") return add(message, args.splice(1), prompt, user);
                else if (args[0].toLowerCase() == "remove") return remove(message, args.splice(1), prompt);
            });
        });
    }
}

// Function to add redeems to trade.
function add(message, args, prompt, user_data) {
    var current_user = 0;
    if (message.author.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_credit = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_credit = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
    }

    if (!isInt(args[0])) { return message.channel.send('Invalid Syntax!'); }
    var amount = parseInt(args[0]);
    if (amount < 1) { return message.channel.send('Invalid Amount!'); }

    var new_credit = old_credit + amount;

    if (new_credit > user_data.Redeems || user_data.Redeems == undefined || user_data.Redeems == NaN) { return message.channel.send('You do not have enough Redeems!'); }

    if (current_user == 1) {
        prompt.Trade.User2IConfirm = false;
        prompt.Trade.Redeems.User1 = new_credit;
        prompt.save();
    } else {
        prompt.Trade.User1IConfirm = false;
        prompt.Trade.Redeems.User2 = new_credit;
        prompt.save();
    }

    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
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

// Function to remove redeems from trade.
function remove(message, args, prompt) {
    var current_user = 0;
    if (message.author.id == prompt.UserID.User1ID) {
        current_user = 1;
        if (prompt.Trade.User1IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_credit = prompt.Trade.Redeems.User1 == undefined ? 0 : prompt.Trade.Redeems.User1;
    } else {
        current_user = 2;
        if (prompt.Trade.User2IConfirm == true) { message.channel.send('You already confirmed your trade.'); return; }
        var old_credit = prompt.Trade.Redeems.User2 == undefined ? 0 : prompt.Trade.Redeems.User2;
    }

    if (!isInt(args[0])) { return message.channel.send('Invalid Syntax!'); }
    var amount = parseInt(args[0]);
    if (amount < 1) { return message.channel.send('Invalid Amount!'); }

    var new_credit = old_credit - amount;

    if (new_credit < 0) { return message.channel.send('Invalid amount to remove!'); }

    if (current_user == 1) {
        prompt.Trade.User2IConfirm = false;
        prompt.Trade.Redeems.User1 = new_credit;
        prompt.save();
    } else {
        prompt.Trade.User1IConfirm = false;
        prompt.Trade.Redeems.User2 = new_credit;
        prompt.save();
    }

    message.channel.messages.fetch(prompt.Trade.MessageID).then(message_old => {
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
        var credits = prompt.Trade.Credits.User1 == undefined ? 0 : prompt.Trade.Credits.User1;
        var shards = prompt.Trade.Shards.User1 == undefined ? 0 : prompt.Trade.Shards.User1;
        var line_counter = prompt.Trade.User1Items.length + 1;
        if (credits > 0) { extra_msg += `${line_counter} | ${credits} Credits\n`; line_counter++; }
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Redeems\n`; line_counter++; }
        if (shards > 0) { extra_msg += `${line_counter} | ${shards} Shards\n`; line_counter++; }
    }
    if (current_user == 2) {
        var credits = prompt.Trade.Credits.User2 == undefined ? 0 : prompt.Trade.Credits.User2;
        var shards = prompt.Trade.Shards.User2 == undefined ? 0 : prompt.Trade.Shards.User2;
        var line_counter = prompt.Trade.User2Items.length + 1;
        if (credits > 0) { extra_msg += `${line_counter} | ${credits} Credits\n`; line_counter++; }
        if (new_credit > 0) { extra_msg += `${line_counter} | ${new_credit} Redeems\n`; line_counter++; }
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
    name: "r",
    aliases: []
}