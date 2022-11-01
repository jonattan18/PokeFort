const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

var static_user_pokemons = null;

module.exports.run = async (bot, interaction, user_available, pokemons, cmd) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    /* // Admin
     if (interaction.isadmin && message.AdminServer == message.guild.id) {
         var user_id = interaction.user.id;
         user_id = args[0];
         // Fetch given user's avatar, username
         bot.users.fetch(user_id).then(user => {
             args.shift();
             interaction.user = user;
             return call_pokemon();
         }).catch(err => {
             return call_pokemon();
         });
     } else return call_pokemon();
 
     function call_pokemon() { */

    page = 1;
    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);
        getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {

            static_user_pokemons = pokemons_from_database;
            var user_pokemons = pokemons_from_database;
            var order_type = user.OrderType;

            // Ordering Pokemons based on user.
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
                    user_pokemons[i]["Name"] = getPokemons.get_pokemon_name_from_id(user_pokemons[i].PokemonId, pokemons, false);
                }
                user_pokemons = _.orderBy(user_pokemons, ['Name'], ['asc']);
            }

            // For only pk command
            if (interaction.options.get("page") == null && interaction.options.get("filter") == null) {
                return create_pagination(interaction, pokemons, user_pokemons);
            }

            // For only int type command
            if (interaction.options.get("page") != null) {
                if (user_pokemons.length > 20) {
                    page = interaction.options.get("page").value;
                    if (interaction.options.get("filter") == null) create_pagination(interaction, pokemons, user_pokemons, page);
                } else return interaction.reply({ content: `You don't have enough pokemons in that page!`, ephemeral: true });
            }

            if (interaction.options.get("filter") != null) {
                // Multi commmand controller.
                var args = interaction.options.get("filter").value.replaceAll("—", "--").split(" ");
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
                    else if (new_args.length == 1 && (_.isEqual(new_args[0], "--gmax") || _.isEqual(new_args[0], "--gigantamax"))) { gigantamax(new_args); }
                    else if (new_args.length == 1 && (_.isEqual(new_args[0], "--mega"))) { mega(new_args); }
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
                    else return interaction.reply({ content: "Invalid command.", ephemeral: true });

                    // Check if error occurred in previous loop
                    if (error.length > 1) {
                        interaction.reply({ content: `Error: Argument ${'``' + error[0] + '``'} says ${error[1][1]}`, ephemeral: true });
                        break;
                    }
                    if (is_not) {
                        user_pokemons = old_pokemons.filter(x => !user_pokemons.includes(x));
                    }
                    if (j == total_args.length - 1) { create_pagination(interaction, pokemons, user_pokemons, page); }
                }
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

            // For pk --gigantamax command.
            function gigantamax(args) {
                var filtered_pokemons = [];
                for (i = 0; i < user_pokemons.length; i++) {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                    if (pokemon_db["Alternate Form Name"] === "Gigantamax") {
                        filtered_pokemons.push(user_pokemons[i]);
                    }
                }
                user_pokemons = filtered_pokemons;
            }

            // For pk --mega command.
            function mega(args) {
                var filtered_pokemons = [];
                for (i = 0; i < user_pokemons.length; i++) {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                    if (pokemon_db["Alternate Form Name"] === "Mega" || pokemon_db["Alternate Form Name"] === "Mega X" || pokemon_db["Alternate Form Name"] === "Mega Y") {
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
                args.shift();
                var filtered_pokemons = [];
                for (i = 0; i < user_pokemons.length; i++) {
                    var user_found_pokemon = getPokemons.getPokemonData(args, pokemons);
                    if (user_found_pokemon != null && user_found_pokemon["Pokemon Id"] == user_pokemons[i].PokemonId) {
                        filtered_pokemons.push(user_pokemons[i]);
                    }
                }
                user_pokemons = filtered_pokemons;
            }

            // For pk --nickname command.
            function nickname(args) {
                if (args.length == 1) {
                    user_pokemons = user_pokemons.filter(pokemon => pokemon.Nickname != undefined);
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
            function hpiv(args) {
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
                else if (args[1].toLowerCase() == "level" || args[1].toLowerCase() == "lvl") { order_type = "Level"; }
                else if (args[1].toLowerCase() == "alphabet") { order_type = "Alphabet"; }
                else if (args[1].toLowerCase() == "number") { order_type = "Number"; }
                else { return error[1] = [false, "Invalid argument syntax."] }
                user_model.findOneAndUpdate({ UserID: interaction.user.id }, { $set: { OrderType: order_type } }, { new: true }, (err, doc) => {
                    if (err) return console.log(err);
                    return interaction.reply({ content: "Pokemon Order updated.", ephemeral: true });
                });
            }

            // For pk --evolution command.
            function evolution(args) {
                var filtered_pokemons = [];
                var dex_numbers = [];
                if (args.length == 2) {
                    var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Name"].toLowerCase() == args[1].toLowerCase())[0];
                    if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokémon name."] }

                    // Push Pokemon Id Of all dex number of the found pokemon to the filtered_pokemons array.
                    dex_numbers.push(found_pokemon["Pokedex Number"]);

                    if (found_pokemon.Evolution != undefined && found_pokemon.Evolution.Reason == "Level") {
                        var found_pokemon_dex_number = pokemons.filter(pokemon => pokemon["Pokemon Id"] == found_pokemon.Evolution.Id)[0];
                        dex_numbers.push(found_pokemon_dex_number["Pokedex Number"]);
                        var double_found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Id"] == found_pokemon.Evolution.Id)[0];
                        if (double_found_pokemon.Evolution != undefined && double_found_pokemon.Evolution.Reason == "Level") {
                            var found_pokemon_dex_number = pokemons.filter(pokemon => pokemon["Pokemon Id"] == double_found_pokemon.Evolution.Id)[0];
                            dex_numbers.push(found_pokemon_dex_number["Pokedex Number"]);
                        }
                    }

                    var pre_found_pokemon = pokemons.filter(pokemon => pokemon.Evolution.Id == found_pokemon["Pokemon Id"])[0];
                    if (pre_found_pokemon != undefined && pre_found_pokemon.Evolution.Reason == "Level") {
                        var found_pokemon_dex_number = pokemons.filter(pokemon => pokemon["Pokemon Id"] == pre_found_pokemon["Pokemon Id"])[0];
                        dex_numbers.push(found_pokemon_dex_number["Pokedex Number"]);
                        var double_pre_found_pokemon = pokemons.filter(pokemon => pokemon.Evolution.Id == pre_found_pokemon["Pokemon Id"])[0];
                        if (double_pre_found_pokemon != undefined && double_pre_found_pokemon.Evolution.Reason == "Level") {
                            var found_pokemon_dex_number = pokemons.filter(pokemon => pokemon["Pokemon Id"] == double_pre_found_pokemon["Pokemon Id"])[0];
                            dex_numbers.push(found_pokemon_dex_number["Pokedex Number"]);
                        }
                    }

                    // Get Ids for all the dex numbers.
                    dex_numbers.forEach(dex_number => {
                        var found_pokemon = pokemons.filter(pokemon => pokemon["Pokedex Number"] == dex_number);
                        found_pokemon.forEach(pokemon => {
                            filtered_pokemons.push(pokemon["Pokemon Id"]);
                        });
                    });
                    user_pokemons = user_pokemons.filter(pokemon => filtered_pokemons.includes(pokemon["PokemonId"]));
                }
                else { return error[1] = [false, "Invalid argument syntax."] }
            }

        });
    });
    //}
}

// Function for pagination.
function create_pagination(interaction, pokemons, user_pokemons, page = 1) {

    if (user_pokemons.length == 0) return interaction.reply({ content: "Pokemons not found.", ephemeral: true });

    var chunked_pokemons = chunkArray(user_pokemons, 20);
    var global_embed = [];
    for (a = 0; a < chunked_pokemons.length; a++) {
        if (chunked_pokemons[a] == undefined) break;

        var description = "";
        for (i = 0; i < chunked_pokemons[a].length; i++) {

            //Get Pokemon Name from Pokemon ID.
            var pokemon_name = getPokemons.get_pokemon_name_from_id(chunked_pokemons[a][i]["PokemonId"], pokemons, chunked_pokemons[a][i].Shiny, true);

            var total_iv = ((chunked_pokemons[a][i].IV[0] + chunked_pokemons[a][i].IV[1] + chunked_pokemons[a][i].IV[2] + chunked_pokemons[a][i].IV[3] + chunked_pokemons[a][i].IV[4] + chunked_pokemons[a][i].IV[5]) / 186 * 100).toFixed(2);
            var pokemon_number = static_user_pokemons.findIndex(x => x === chunked_pokemons[a][i]);
            if (chunked_pokemons[a][i].Nickname != undefined) {
                description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}% | Nickname: ${chunked_pokemons[a][i].Nickname}\n`;
            }
            else { description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}%\n`; }
        }

        // Create embed message
        var username = interaction.user.username;
        let embed = new Discord.EmbedBuilder();
        embed.setTitle(`**${username}'s Pokémon:**`)
        embed.setColor(interaction.member ? interaction.member.displayHexColor : '#000000');
        embed.setDescription(description);
        embed.setFooter({ text: `Page ${a + 1}/${chunked_pokemons.length}. You have ${user_pokemons.length} Pokemon.` });
        global_embed.push(embed);
    }

    page = page - 1;
    if (page > global_embed.length - 1 || page < 0) return interaction.reply({ content: 'No page found.', ephemeral: true });

    // Send message to channel.
    interaction.reply({ embeds: [global_embed[page]] , fetchReply: true}).then(msg => {
        if (global_embed.length == 1) return;
        pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, global_embed, page);
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

module.exports.config = {
    name: "pokemon",
    description: "Displays your Pokemons.",
    options: [{
        name: "filter",
        description: "Filter your Pokemons.",
        type: 3,
        min_length: 1
    }, {
        name: "page",
        description: "Page number.",
        type: 4,
        min_value: 1
    }],
    aliases: []
}