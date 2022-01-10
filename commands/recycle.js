const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {

    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;

        // If no arguments
        if (args.length == 0) {
            return message.channel.send("Please mention the pokemons by using filter option.");
        }

        // If arguments is latest or l
        else if (args[0].toLowerCase() == "l" || args[0].toLowerCase() == "latest") {
            var selected_pokemon = [user_pokemons[user_pokemons.length - 1]];
            return recycle(message, pokemons, selected_pokemon, prefix, user);
        }

        // For only recycle int type command
        else if (onlyNumbers(args)) {
            user_pokemons = user_pokemons.filter((_, index) => args.includes((index + 1).toString()));
            return recycle(message, pokemons, user_pokemons, prefix, user);
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
            else { message.channel.send("Invalid command."); return; }

            // Check if error occurred in previous loop
            if (error.length > 1) {
                message.channel.send(`Error: Argument ${'``' + error[0] + '``'} says ${error[1][1]}`);
                break;
            }
            if (is_not) {
                user_pokemons = old_pokemons.filter(x => !user_pokemons.includes(x));
            }
            if (j == total_args.length - 1) { recycle(message, pokemons, user_pokemons, prefix, user); }
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
                user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname.toLowerCase() === args.join(" ").toLowerCase());
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
        function hp_iv() {
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

        // For pk --evolution command.
        function evolution(args) {
            var filtered_pokemons = [];
            if (args.length == 2) {
                var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Name"].toLowerCase() == args[1].toLowerCase())[0];
                if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
                filtered_pokemons.push(parseInt(found_pokemon["Pokemon Id"]));

                var pre_evolution = pokemons.filter(it => it["Pokemon Id"] === found_pokemon["Pre-Evolution Pokemon Id"].toString())[0];
                if (pre_evolution) filtered_pokemons.push(parseInt(pre_evolution["Pokemon Id"]));

                var pre_pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
                if (pre_pre_evolution) filtered_pokemons.push(parseInt(pre_pre_evolution["Pokemon Id"]));

                if (pre_evolution) var post_evolution = pokemons.filter(it => it["Pokemon Id"] === pre_evolution["Pre-Evolution Pokemon Id"].toString())[0];
                if (post_evolution) filtered_pokemons.push(parseInt(post_evolution["Pokemon Id"]));

                if (pre_pre_evolution) var post_post_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pre_pre_evolution["Pokemon Id"]))[0];
                if (post_post_evolution) filtered_pokemons.push(parseInt(post_post_evolution["Pokemon Id"]));

                duo_filtered_pokemons = user_pokemons.filter(pokemon => filtered_pokemons.includes(pokemon["PokemonId"]));
                user_pokemons = duo_filtered_pokemons;
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

    });

}

// Function for recycle.
function recycle(message, pokemons, user_pokemons, prefix, user) {
    if (user_pokemons.length == 0) { message.channel.send("Pokemons not found."); return; }

    // Get selected pokemon name.
    var selected_user_pokemons = user.Pokemons;
    var selected_pokemon = selected_user_pokemons.filter(it => it._id == user.Selected)[0];
    var selected_pokemon_name = get_pokemon_name(pokemons, selected_pokemon["PokemonId"], selected_pokemon);

    // Remove selected pokemon in list if it is in the list.
    var user_pokemons = user_pokemons.filter(pokemon => pokemon._id != selected_pokemon._id);
    if (user_pokemons.length == 0) { message.channel.send("Pokemons not found."); return; }

    // Collecting pokemon ids.
    var total_pokemon_level = 0;
    var pokemon_ids = [];
    for (var i = 0; i < user_pokemons.length; i++) {
        total_pokemon_level += user_pokemons[i].Level;
        pokemon_ids.push(user_pokemons[i]._id);
    }

    var description = "";
    var display_pokemons = user_pokemons.slice(0, 20);
    for (let i = 0; i < display_pokemons.length; i++) {
        const element = display_pokemons[i];
        var pokemon_name = get_pokemon_name(pokemons, element["PokemonId"], element, true);
        description += `Level ${element["Level"]} ${pokemon_name}\n`;
    }
    if (user_pokemons.length > 20) { description += `\n+${user_pokemons.length - 20} other pokemons` }

    var total_xp = total_pokemon_level * 66;

    // Create a new Message embed.
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`Are you sure you want to recycle all these pokemons?\nYour Level ${selected_pokemon.Level} ${selected_pokemon_name} will gain ${total_xp.toLocaleString()} xp!`);
    embed.setDescription(description);
    embed.setColor(message.member.displayHexColor);
    embed.setFooter(`Type ${prefix}confirm to continue or ${prefix}cancel to cancel.`);

    pokemon_ids.push(total_xp);

    message.channel.send(embed).then(msg => {
        channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
            channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt.UserID": message.author.id, "Prompt.Pokemons": pokemon_ids, "Prompt.Timestamp": Date.now(), "Prompt.Reason": "Recycle" } }, (err, channel) => {
                if (err) return console.log(err);
                if (!channel) return;
            });
        });
    });
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(pokemons, pokemon_id, selected_pokemon, star_shiny = false) {
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
    if (selected_pokemon.Shiny) { if (star_shiny) { pokemon_name = ':star: ' + pokemon_name; } else { pokemon_name = 'Shiny ' + pokemon_name; } }
    return pokemon_name;
}

// Calculate total iv from iv array.
function total_iv(iv) {
    var total_iv = ((iv[0] + iv[1] + iv[2] + iv[3] + iv[4] + iv[5]) / 186 * 100).toFixed(2);
    return total_iv;
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

module.exports.config = {
    name: "recycle",
    aliases: []
}