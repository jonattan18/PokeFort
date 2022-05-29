const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const floor = require('lodash/floor');

// Models
const user_model = require('../models/user');
const market_model = require('../models/market');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons, cmd) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    page = 1;
    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var request_url = "";

        // For only market command
        if (args.length == 0) {
            return message.channel.send("Market what ? Apple or Pizza ? Lmao Type something Baka !!");
        }

        // For market list command
        if (args[0] == "list" && args.length == 3) {
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                if (!isInt(args[2])) return message.channel.send("When listing on a market, you must specify a price.");
                if (args[2] < 1) return message.channel.send("Isn't that too low for a pokemon ? Minimum price is 1.");
                if (args[2] > 1000000000) return message.channel.send("Isn't that too high for a pokemon ? Maximum price is 1,000,000,000.");

                // If arguments is latest or l
                if (args[1].toLowerCase() == "l" || args[1].toLowerCase() == "latest") var selected_pokemon = user_pokemons[user_pokemons.length - 1];
                // If arguments is number
                else if (isInt(args[1])) {
                    if (typeof user_pokemons[args[1] - 1] != 'undefined') var selected_pokemon = user_pokemons[args[1] - 1];
                    else return message.channel.send("No pokemon exists with that number.");
                }
                else return message.channel.send("Please type a valid pokemon number.");

                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);

                prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { $or: [{ "Trade.Accepted": true }, { "Duel.Accepted": true }] }] }, (err, _trade) => {
                    if (err) return console.log(err);
                    if (_trade) return message.channel.send("You can't add market listing now!");

                    var update_data = new prompt_model({
                        ChannelID: message.channel.id,
                        PromptType: "ConfirmList",
                        UserID: {
                            User1ID: message.author.id
                        },
                        List: {
                            PokemonUID: selected_pokemon._id,
                            Price: args[2]
                        }
                    });

                    update_data.save().then(result => {
                        return message.channel.send(`Are you sure you want to list your level ${selected_pokemon.Level} ${pokemon_name} on the market for ${args[2]}? Type \`\`${prefix}confirmlist\`\` to continue or \`\`${prefix}cancel\`\` to cancel the lisitng.`);
                    });
                });
            });
        }

        // For view or info pokemon command  
        else if ((args[0] == "view" || args[0] == "info") && args.length == 2) {
            if (!isInt(args[1])) return message.channel.send("Please type a valid pokemon ID.");

            market_model.findOne({ "MarketID": args[1] }, (err, market) => {
                if (!market) return message.channel.send("No pokemon exists with that ID.");
                else {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == market.PokemonId)[0];

                     //Get Pokemon Name from Pokemon ID.
                    var pokemon_name = getPokemons.get_pokemon_name_from_id(market.PokemonId, pokemons, market.Shiny, true);

                    let exp = market.Experience;
                    let level = market.Level;
                    let hp_iv = market.IV[0];
                    let atk_iv = market.IV[1];
                    let def_iv = market.IV[2];
                    let spa_iv = market.IV[3];
                    let spd_iv = market.IV[4];
                    let spe_iv = market.IV[5];
                    let nature = market.NatureValue;
                    let shiny = market.Shiny;
                    let ev = 0;

                    let description = `${exp}/${exp_to_level(level)}XP`;
                    var type = "";
                    if (pokemon_db["Secondary Type"] != "NULL") { type = pokemon_db["Primary Type"] + " | " + pokemon_db["Secondary Type"] }
                    else { type = pokemon_db["Primary Type"]; }
                    let nature_name = nature_of(nature)[0];
                    let hp = floor(0.01 * (2 * pokemon_db["Health Stat"] + hp_iv + floor(0.25 * ev)) * level) + level + 10;
                    let atk = (floor(0.01 * (2 * pokemon_db["Attack Stat"] + atk_iv + floor(0.25 * ev)) * level) + 5);
                    let def = (floor(0.01 * (2 * pokemon_db["Defense Stat"] + def_iv + floor(0.25 * ev)) * level) + 5);
                    let spa = (floor(0.01 * (2 * pokemon_db["Special Attack Stat"] + spa_iv + floor(0.25 * ev)) * level) + 5);
                    let spd = (floor(0.01 * (2 * pokemon_db["Special Defense Stat"] + spd_iv + floor(0.25 * ev)) * level) + 5);
                    let spe = (floor(0.01 * (2 * pokemon_db["Speed Stat"] + spe_iv + floor(0.25 * ev)) * level) + 5);
                    let total_iv = ((hp_iv + atk_iv + def_iv + spa_iv + spd_iv + spe_iv) / 186 * 100).toFixed(2);
        
                    // Nature Change
                    var nature_value = nature_of(nature);
                    hp += percentage(hp, nature_value[1]);
                    atk += percentage(atk, nature_value[2]);
                    def += percentage(def, nature_value[3]);
                    spa += percentage(spa, nature_value[4]);
                    spd += percentage(spd, nature_value[5]);
                    spe += percentage(spe, nature_value[6]);
        
                    // Image url
                    var form = pokemon_db["Alternate Form Name"];
                    var str = "" + pokemon_db["Pokedex Number"];
                    var pad = "000"
                    var pokedex_num = pad.substring(0, pad.length - str.length) + str;
                    if (form == "NULL") { form = ""; }
                    if (form == "" && shiny) { var image_name = pokedex_num + '-Shiny.png'; }
                    else if (form == "" && !shiny) { var image_name = pokedex_num + '.png'; }
                    else if (form != "" && shiny) { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '-Shiny.png'; }
                    else if (form != "" && !shiny) { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
                    else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
                    var image_url = './assets/images/' + image_name.replace("%", "");
                    var held_item = market.Held != undefined ? `**\n_Holding: ${market.Held}_**` : "";        

                    var embed = new Discord.MessageEmbed();
                    embed.attachFiles(image_url)
                    embed.setTitle(`Level ${market.Level} ${pokemon_name} - ID: ${market.MarketID} - Price: ${market.Price}`);
                    embed.setColor(message.member.displayHexColor);
                    embed.setDescription(description +
                        `\n**Type**: ${type}` + held_item +
                        `\n**Nature**: ${nature_name}` +
                        `\n**HP**: ${hp} - IV ${hp_iv}/31` +
                        `\n**Attack**: ${atk} - IV ${atk_iv}/31` +
                        `\n**Defense**: ${def} - IV ${def_iv}/31` +
                        `\n**Sp. Atk**: ${spa} - IV ${spa_iv}/31` +
                        `\n**Sp. Def**: ${spd} - IV ${spd_iv}/31` +
                        `\n**Speed**: ${spe} - IV ${spe_iv}/31` +
                        `\n**Total IV**: ${total_iv}%`);
                    embed.setImage('attachment://' + image_name.replace("%", ""))
                    embed.setFooter(`To buy this pokemon, type ${prefix}market buy ${market.MarketID}`);
                    message.channel.send(embed)
                }
            });
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
            if (j == total_args.length - 1) { create_pagination(message, pokemons, user_pokemons); }
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
            else if (args[1].toLowerCase() == "level" || args[1].toLowerCase() == "lvl") { order_type = "Level"; }
            else if (args[1].toLowerCase() == "alphabet") { order_type = "Alphabet"; }
            else if (args[1].toLowerCase() == "number") { order_type = "Number"; }
            else { return error[1] = [false, "Invalid argument syntax."] }
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
    });
}

// Function to get the nature from number.
function nature_of(int) {
    if (int == 1) { return ["Adament", 0, 10, 0, -10, 0, 0] }
    else if (int == 2) { return ["Bashful", 0, 0, 0, 0, 0, 0] }
    else if (int == 3) { return ["Bold", 0, -10, 10, 0, 0, 0] }
    else if (int == 4) { return ["Brave", 0, 10, 0, 0, 0, -10] }
    else if (int == 5) { return ["Calm", 0, -10, 0, 0, 10, 0] }
    else if (int == 6) { return ["Careful", 0, 0, 0, -10, 10, 0] }
    else if (int == 7) { return ["Docile", 0, 0, 0, 0, 0, 0] }
    else if (int == 8) { return ["Gentle", 0, 0, -10, 0, 10, 0] }
    else if (int == 9) { return ["Hardy", 0, 0, 0, 0, 0, 0] }
    else if (int == 10) { return ["Hasty", 0, 0, -10, 0, 0, 10] }
    else if (int == 11) { return ["Impish", 0, 0, 10, -10, 0, 0] }
    else if (int == 12) { return ["Jolly", 0, 0, 0, -10, 0, 10] }
    else if (int == 13) { return ["Lax", 0, 10, 0, 0, -10, 0] }
    else if (int == 14) { return ["Lonely", 0, 10, -10, 0, 0, 0] }
    else if (int == 15) { return ["Mild", 0, 0, -10, 10, 0, 0] }
    else if (int == 16) { return ["Modest", 0, 0, 0, 10, 0, -10] }
    else if (int == 17) { return ["Naive", 0, 0, 0, 0, -10, 10] }
    else if (int == 18) { return ["Naughty", 0, 10, 0, 0, -10, 0] }
    else if (int == 19) { return ["Quiet", 0, 0, 0, 10, 0, -10] }
    else if (int == 20) { return ["Quirky", 0, 0, 0, 0, 0, 0] }
    else if (int == 21) { return ["Rash", 0, 0, 0, 10, -10, 0] }
    else if (int == 22) { return ["Relaxed", 0, 0, 10, 0, 0, -10] }
    else if (int == 23) { return ["Sassy", 0, 0, 0, 0, 10, -10] }
    else if (int == 24) { return ["Serious", 0, 0, 0, 0, 0, 0] }
    else if (int == 25) { return ["Timid", 0, -10, 0, 0, 0, 10] }
}

// Percentage calculation.
function percentage(percent, total) {
    return parseInt(((percent / 100) * total).toFixed(0));
}

// Calculate total iv from iv array.
function total_iv(iv) {
    var total_iv = ((iv[0] + iv[1] + iv[2] + iv[3] + iv[4] + iv[5]) / 186 * 100).toFixed(2);
    return total_iv;
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
}

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
    name: "market",
    aliases: []
}