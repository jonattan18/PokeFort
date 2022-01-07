const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

var static_user_pokemons = null;

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    page = 1;
    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        static_user_pokemons = user.Pokemons;
        var user_pokemons = user.Pokemons;
        var order_type = user.OrderType;

        if (order_type == "Level") { user_pokemons = _.orderBy(user_pokemons, ['Level'], ['asc']); }
        else if (order_type == "IV") {
            for (i = 0; i < user_pokemons.length; i++) {
                user_pokemons[i]["Total_IV"] = parseFloat(total_iv(user_pokemons[i].IV));
            }
            user_pokemons = _.orderBy(user_pokemons, ['Total_IV'], ['desc']);
        }
        else if (order_type == "Number") { user_pokemons = user_pokemons; }
        else if (order_type == "Alphabet") {
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                var temp_name = "";
                if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
                else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
                else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
                else { temp_name = pokemon_db["Pokemon Name"]; }
                var pokemon_name = temp_name;
                user_pokemons[i]["Name"] = pokemon_name;
            }
            user_pokemons = _.orderBy(user_pokemons, ['Name'], ['asc']);
        }

        // For only pk command.
        if (args.length == 0 || (args.length == 1 && isInt(args[0]))) {
            if (args.length == 1) { page = parseInt(args[0]); }
            pagination(message, pokemons, user_pokemons);
        }

        // For pk --shiny command.
        if (args.length == 1 && args[0] == '--shiny' || args[0] == "--s") {
            user_pokemons = user_pokemons.filter(pokemon => pokemon.Shiny);
            pagination(message, pokemons, user_pokemons);
        }

        // For pk --legendary command.
        else if (args.length == 1 && args[0] == '--legendary' || args[0] == "--l") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId.toString())[0];
                if (pokemon_db["Legendary Type"] === "Legendary" || pokemon_db["Legendary Type"] === "Sub-Legendary" && pokemon_db["Alternate Form Name"] === "NULL" && pokemon_db["Primary Ability"] != "Beast Boost") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            pagination(message, pokemons, filtered_pokemons);
        }

        // For pk --mythical command.
        else if (args.length == 1 && args[0] == '--mythical' || args[0] == "--m") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                if (pokemon_db["Legendary Type"] === "Mythical" && pokemon_db["Alternate Form Name"] === "NULL") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            pagination(message, pokemons, filtered_pokemons);
        }

        // For pk --ultrabeast command.
        else if (args.length == 1 && args[0] == '--ultrabeast' || args[0] == "--ub") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                if (pokemon_db["Primary Ability"] === "Beast Boost" && pokemon_db["Alternate Form Name"] === "NULL") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            pagination(message, pokemons, filtered_pokemons);
        }

        // For pk --alolan command.
        else if (args.length == 1 && args[0] == '--alolan' || args[0] == "--a") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                if (pokemon_db["Alternate Form Name"] === "Alola") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            pagination(message, pokemons, filtered_pokemons);
        }

        // For pk --galarian command.
        else if (args.length == 1 && args[0] == '--galarian' || args[0] == "--g") {
            var filtered_pokemons = [];
            for (i = 0; i < user_pokemons.length; i++) {
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                if (pokemon_db["Alternate Form Name"] === "Galar") {
                    filtered_pokemons.push(user_pokemons[i]);
                }
            }
            pagination(message, pokemons, filtered_pokemons);
        }

        // For pk --nickname command.
        else if (args.length == 2 && args[0] == '--nickname' || args[0] == "--nn") {
            user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname.toLowerCase() === args[1].toLowerCase());
            pagination(message, pokemons, user_pokemons);
        }

        // For pk --level command.
        else if (args[0] == '--level' || args[0] == "--lvl") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.Level < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --iv command.
        else if (args[0] == '--iv') {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1]) || isFloat(parseFloat(args[1]))) {
                filtered_pokemons = user_pokemons.filter(pokemon => total_iv(pokemon.IV) == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
                filtered_pokemons = user_pokemons.filter(pokemon => parseFloat(total_iv(pokemon.IV)) > parseFloat(args[2]));
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
                filtered_pokemons = user_pokemons.filter(pokemon => parseFloat(total_iv(pokemon.IV)) < parseFloat(args[2]));
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --hpiv command.
        else if (args[0] == '--hpiv') {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[0] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --atkiv command.
        else if (args[0] == '--attackiv' || args[0] == "--atkiv") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[1] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --defiv command.
        else if (args[0] == '--defenseiv' || args[0] == "--defiv") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[2] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --spatkiv command.
        else if (args[0] == '--specialattackiv' || args[0] == "--spatkiv") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[3] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --spdefiv command.
        else if (args[0] == '--specialdefenseiv' || args[0] == "--spdefiv") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[4] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --speediv command.
        else if (args[0] == '--speediv' || args[0] == "--spiv") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                message.channel.send("Please specify a value.");
            }
            else if (args.length == 2 && isInt(args[1])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] == args[1]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] > args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                filtered_pokemons = user_pokemons.filter(pokemon => pokemon.IV[5] < args[2]);
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --triple command.
        else if (args[0] == "--trip" || args[0] == "--triple") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 3));
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --quadra command.
        else if (args[0] == "--quad" || args[0] == "--quadra") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 4));
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --penta command.
        else if (args[0] == "--pent" || args[0] == "--penta") {
            var filtered_pokemons = [];
            if (args.length == 1) {
                filtered_pokemons = user_pokemons.filter(pokemon => has_repeated(pokemon.IV, 5));
                pagination(message, pokemons, filtered_pokemons);
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

        // For pk --order command.
        else if (args[0] == "--order") {
            if (args.length != 2) { return message.channel.send("Invalid argument syntax.") }
            var order_type = "";
            if (args[1].toLowerCase() == "iv") { order_type = "IV"; }
            else if (args[1].toLowerCase() == "level") { order_type = "Level"; }
            else if (args[1].toLowerCase() == "alphabet") { order_type = "Alphabet"; }
            else if (args[1].toLowerCase() == "number") { order_type = "Number"; }

            user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { OrderType: order_type } }, { new: true }, (err, doc) => {
                if (err) { console.log(err); }
                else {
                    message.channel.send("Pokemon Order updated.");
                }
            });
        }

        // For pk --evolution command.
        else if (args[0] == "--evolution" || args[0] == "--e") {
            var filtered_pokemons = [];
            if (args.length == 2) {
                var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Name"].toLowerCase() == args[1].toLowerCase())[0];
                var pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
                if (pre_evolution) {  
                    var newpoke = pokemons.filter(it => it["Pokemon Id"] == pre_evolution["Pokemon Id"])[0];

                    if(newpoke["Pre-Evolution Pokemon Id"]) {
                        filtered_pokemons.push(user_pokemons.filter(pokemon => pokemon.PokemonId == newpoke["Pre-Evolution Pokemon Id"])[0]);
                    }

                    filtered_pokemons.push(user_pokemons.filter(pokemon => pokemon.PokemonId == parseInt(newpoke["Pokemon Id"]))[0]);
                }
                pagination(message, pokemons, filtered_pokemons)
            }
            else { return message.channel.send("Invalid argument syntax.") }
        }

    });
}

// Function for pagination.
function pagination(message, pokemons, user_pokemons) {

    if (user_pokemons.length == 0) { message.channel.send("Pokemons not found."); return; }

    var chunked_pokemons = chunkArray(user_pokemons, 20);
    var global_embed = [];
    for (a = 0; a < chunked_pokemons.length; a++) {
        if (chunked_pokemons[a] == undefined) break;

        var description = "";
        for (i = 0; i < chunked_pokemons[a].length; i++) {

            //Get Pokemon Name from Pokemon ID.
            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == chunked_pokemons[a][i].PokemonId)[0];
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
            if (chunked_pokemons[a][i].Shiny) { pokemon_name += ' :star:' }

            var total_iv = ((chunked_pokemons[a][i].IV[0] + chunked_pokemons[a][i].IV[1] + chunked_pokemons[a][i].IV[2] + chunked_pokemons[a][i].IV[3] + chunked_pokemons[a][i].IV[4] + chunked_pokemons[a][i].IV[5]) / 186 * 100).toFixed(2);
            var pokemon_number = static_user_pokemons.findIndex(x => x === chunked_pokemons[a][i]);
            if (chunked_pokemons[a][i].Nickname != "") {
                description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}% | Nickname: ${chunked_pokemons[a][i].Nickname}\n`;
            }
            else { description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}%\n`; }
        }

        // Create embed message
        var username = message.author.username;
        let embed = new Discord.MessageEmbed();
        embed.setTitle(`**${username}'s Pokémon:**`)
        embed.setColor(message.member.displayHexColor)
        embed.setDescription(description);
        embed.setFooter(`Page ${a + 1}/${chunked_pokemons.length}. You have ${user_pokemons.length} Pokemon.`);
        global_embed.push(embed);
    }

    page = page - 1;
    if (page > global_embed.length - 1 || page < 0) { return message.channel.send('No page found.') }

    // Send message to channel.
    message.channel.send(global_embed[page]).then(msg => {
        if (global_embed.length == 1) return;
        channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
            if (err) return console.log(err);
            if (!channel) return;
            var Pagination = channel.Pagination;
            var user_page = Pagination.filter(it => it.UserID == message.author.id)[0];
            if (!user_page) {
                channel.Pagination.push({
                    UserID: message.author.id,
                    Message: JSON.stringify(msg),
                    Embed: global_embed,
                    CurrentPage: page
                });
                channel.save();
            } else {
                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Pagination.$[elem].Message": JSON.stringify(msg), "Pagination.$[elem].Embed": global_embed, "Pagination.$[elem].CurrentPage": 1, "Pagination.$[elem].Timestamp": Date.now() } }, { arrayFilters: [{ "elem.UserID": message.author.id }] }, (err, channel) => {
                    if (err) return console.log(err);
                    if (!channel) return;
                });
            }
        });
    });
}

// Calculate total iv from iv array.
function total_iv(iv) {
    var total_iv = ((iv[0] + iv[1] + iv[2] + iv[3] + iv[4] + iv[5]) / 186 * 100).toFixed(2);
    return total_iv;
}

// Check if any value has repeated number of times.
function has_repeated(array, times) {
    const counts = {};
    array.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    const hasValue = Object.values(counts).includes(times);
    return hasValue;
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

module.exports.config = {
    name: "pokemon",
    aliases: []
}