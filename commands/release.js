const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const raid_model = require('../models/raids');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return message.channel.send("You can't release pokemon while you are in a duel!");

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return message.channel.send("You can't release pokemon while you are in a trade!");

            raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
                if (err) { console.log(err); return; }
                if (raid) {
                    if (raid.Started) return message.channel.send("You can't release pokemon while you are in a raid!");
                } else {
                    //Get user data.
                    user_model.findOne({ UserID: message.author.id }, (err, user) => {
                        if (!user) return;
                        if (err) console.log(err);
                        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                            // If no arguments
                            if (args.length == 0) {
                                return message.channel.send("Please mention pokemon number or ``latest`` to release latest pokemon.");
                            }

                            // If arguments is latest or l
                            else if (args[0].toLowerCase() == "l" || args[0].toLowerCase() == "latest") {
                                var selected_pokemon = [user_pokemons[user_pokemons.length - 1]];
                                return release(message, pokemons, selected_pokemon, prefix);
                            }

                            // For only release int type command.
                            else if (onlyNumbers(args)) {
                                user_pokemons = user_pokemons.filter((_, index) => args.includes((index + 1).toString()));
                                return release(message, pokemons, user_pokemons, prefix, user);
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
                                else if (new_args.length == 1 && (_.isEqual(new_args[0], "--h") || _.isEqual(new_args[0], "--hisuian"))) { hisuian(new_args); }
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
                                if (j == total_args.length - 1) { release(message, pokemons, user_pokemons, prefix); }
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

                            // For pk --hisuian command.
                            function hisuian(args) {
                                var filtered_pokemons = [];
                                for (i = 0; i < user_pokemons.length; i++) {
                                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                                    if (pokemon_db["Alternate Form Name"] === "Hisuian") {
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
                                    user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname != "" || pokemon.Nickname != null || pokemon.Nickname != undefined);
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

                            // For pk --evolution command.
                            function evolution(args) {
                                var filtered_pokemons = [];
                                if (args.length == 2) {
                                    var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Name"].toLowerCase() == args[1].toLowerCase())[0];
                                    if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
                                    filtered_pokemons.push(found_pokemon["Pokemon Id"]);

                                    if (found_pokemon.Evolution != undefined && found_pokemon.Evolution.Reason == "Level") {
                                        filtered_pokemons.push(found_pokemon.Evolution.Id);
                                        var double_found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Id"] == found_pokemon.Evolution.Id)[0];
                                        if (double_found_pokemon.Evolution != undefined && double_found_pokemon.Evolution.Reason == "Level") {
                                            filtered_pokemons.push(double_found_pokemon.Evolution.Id);
                                        }
                                    }

                                    var pre_found_pokemon = pokemons.filter(pokemon => pokemon.Evolution.Id == found_pokemon["Pokemon Id"])[0];
                                    if (pre_found_pokemon != undefined && pre_found_pokemon.Evolution.Reason == "Level") {
                                        filtered_pokemons.push(pre_found_pokemon["Pokemon Id"]);
                                        var double_pre_found_pokemon = pokemons.filter(pokemon => pokemon.Evolution.Id == pre_found_pokemon["Pokemon Id"])[0];
                                        if (double_pre_found_pokemon != undefined && double_pre_found_pokemon.Evolution.Reason == "Level") {
                                            filtered_pokemons.push(double_pre_found_pokemon["Pokemon Id"]);
                                        }
                                    }

                                    user_pokemons = user_pokemons.filter(pokemon => filtered_pokemons.includes(pokemon["PokemonId"]));
                                }
                                else { return error[1] = [false, "Invalid argument syntax."] }
                            }

                        });
                    });
                }
            });
        });
    });
}

// Function for release.
function release(message, pokemons, user_pokemons, prefix) {
    if (user_pokemons.length == 0) { message.channel.send("Pokemons not found."); return; }

    // Collecting pokemon ids.
    var pokemon_ids = [];
    for (var i = 0; i < user_pokemons.length; i++) {
        pokemon_ids.push(user_pokemons[i]._id);
    }

    var description = "";
    var display_pokemons = user_pokemons.slice(0, 20);
    for (let i = 0; i < display_pokemons.length; i++) {
        const element = display_pokemons[i];
        var pokemon_name = getPokemons.get_pokemon_name_from_id(element["PokemonId"], pokemons, element.Shiny, true);
        description += `Level ${element["Level"]} ${pokemon_name}\n`;
    }
    if (user_pokemons.length > 20) { description += `\n+${user_pokemons.length - 20} other pokemons` }

    // If alredy exists check
    prompt_model.findOne({ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (prompt != undefined && prompt.Trade.Accepted == true) return message.channel.send("You can't release pokemons while you are in a trade.");

        var new_prompt = null;
        if (prompt) {
            prompt.ChannelID = message.channel.id;
            prompt.UserID.User1ID = message.author.id;
            prompt.PromptType = "Release";
            prompt.Release.Pokemons = pokemon_ids;
            new_prompt = prompt;
        } else {
            new_prompt = new prompt_model({
                "ChannelID": message.channel.id,
                "PromptType": "Release",
                "UserID": { "User1ID": message.author.id },
                "Release.Pokemons": pokemon_ids
            });
        }

        new_prompt.save().then(() => {
            // Create a new Message embed.
            let embed = new Discord.MessageEmbed();
            embed.setTitle(`Are you sure you want to release all these pokemons?`);
            embed.setDescription(description);
            embed.setColor(message.member.displayHexColor);
            embed.setFooter(`Type ${prefix}confirm to continue or ${prefix}cancel to cancel.`);
            message.channel.send(embed);
        });
    });
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
    name: "release",
    aliases: []
}