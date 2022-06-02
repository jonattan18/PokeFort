const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const floor = require('lodash/floor');

// Models
const user_model = require('../models/user');
const auction_model = require('../models/auction');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

/*
List done
remove done
search done
listings done
view/info done
bid
claim
*/

module.exports.run = async (bot, message, args, prefix, user_available, pokemons, cmd) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        // Convert all args to lowercase.
        args = args.map(arg => arg.toLowerCase());

        // For only auction command
        if (args.length == 0) {
            return message.channel.send("Invalid Syntax. Use" + prefix + "help to know about auction commands.");
        }

        // For auction list command
        if (args[0] == "list" && args.length == 4) {
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                if (args[3][args[3].length - 1] != "h") return message.channel.send("Invalid Syntax. Use" + prefix + "help to know about auction commands.");
                if (!isInt(args[2])) return message.channel.send("When listing on a auction, you must specify a buyout.");
                if (args[2] < 1) return message.channel.send("Isn't that too low for a pokemon ? Minimum buyout is 1.");
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

                prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { $or: [{ "Trade.Accepted": true }, { "Duel.Accepted": true }] }] }, (err, _data) => {
                    if (err) return console.log(err);
                    if (_data) return message.channel.send("You can't add auction listing now!");

                    var update_data = new prompt_model({
                        ChannelID: message.channel.id,
                        PromptType: "ConfirmList",
                        UserID: {
                            User1ID: message.author.id
                        },
                        List: {
                            PokemonUID: selected_pokemon._id,
                            Price: args[2],
                            BidTime: args[3]
                        }
                    });

                    update_data.save().then(result => {
                        return message.channel.send(`Are you sure you want to list your level ${selected_pokemon.Level} ${pokemon_name}${selected_pokemon.Shiny == true ? " :star:" : ""} on the auction for ${args[3].replace("h","")} hours with a buyout of ${args[2]} Credits? A listing fee of 175 credits will be deducted from your balance.\nType \`\`${prefix}confirmlist\`\` to confirm or \`\`${prefix}cancel\`\` to cancel the listing.`);
                    });
                });
            });
        }

        // For view or info pokemon command  
        else if ((args[0] == "view" || args[0] == "info") && args.length == 2) {
            if (!isInt(args[1])) return message.channel.send("Please type a valid pokemon ID.");

            auction_model.findOne({ "AuctionID": args[1] }, (err, auction) => {
                if (!auction) return message.channel.send("No pokemon exists with that ID.");
                else {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == auction.PokemonId)[0];

                    //Get Pokemon Name from Pokemon ID.
                    var pokemon_name = getPokemons.get_pokemon_name_from_id(auction.PokemonId, pokemons, auction.Shiny, true);

                    let exp = auction.Experience;
                    let level = auction.Level;
                    let hp_iv = auction.IV[0];
                    let atk_iv = auction.IV[1];
                    let def_iv = auction.IV[2];
                    let spa_iv = auction.IV[3];
                    let spd_iv = auction.IV[4];
                    let spe_iv = auction.IV[5];
                    let nature = auction.NatureValue;
                    let shiny = auction.Shiny;
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
                    var held_item = auction.Held != undefined ? `**\n_Holding: ${auction.Held}_**` : "";

                    var bid_time = new Date(auction.BidTime);
                    var time_left = new Date(bid_time.getTime() - new Date().getTime());
                    var time_left_string = `${time_left.getUTCHours() != 0 ? time_left.getUTCHours() + " hours ": ""} ${time_left.getUTCMinutes() != 0 ? time_left.getUTCMinutes() + " minutes ": ""}`;

                    var embed = new Discord.MessageEmbed();
                    embed.attachFiles(image_url)
                    embed.setTitle(`Level ${auction.Level} ${pokemon_name} - ID: ${auction.AuctionID} - Price: ${auction.Price}`);
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
                        `\n**Total IV**: ${total_iv}%` +
                        `\nCurrent Bid: ${auction.Price} - :hourglass_flowing_sand:${time_left_string}`);
                    embed.setImage('attachment://' + image_name.replace("%", ""))
                    embed.setFooter(`To bid on this pokemon, place a bid of ${auction.Price} credits or more typing "${prefix}auction bid ${auction.AuctionID} <bid>"`);
                    message.channel.send(embed)
                }
            });
        }
        // For market buy command
        else if (args[0] == "buy" && args.length == 2 && isInt(args[1])) {
            market_model.findOne({ "MarketID": args[1] }, (err, market) => {
                if (market == undefined || market == null || !market || market.length == 0) {
                    return message.channel.send("We couldn't find any pokemon associted with that market ID.");
                }
                else if (market.UserID == message.author.id) return message.channel.send("You can't buy your own pokemon.");
                else {
                    var update_data = new prompt_model({
                        ChannelID: message.channel.id,
                        PromptType: "ConfirmBuy",
                        UserID: {
                            User1ID: message.author.id
                        },
                        List: {
                            PokemonUID: market.PokemonUID,
                            MarketID: market.MarketID
                        }
                    });
                    update_data.save().then(() => {
                        return message.channel.send(`Are you sure you want to buy level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} from market? Type \`\`${prefix}confirmbuy\`\` to confirm or \`\`${prefix}cancel\`\` to cancel the stop buying.`);
                    });
                }
            });
        }
        // For auction remove command
        else if (args[0] == "remove" && args.length == 2 && isInt(args[1])) {
            auction_model.findOne({ $and: [{ "UserID": message.author.id }, { "AuctionID": args[1] }] }, (err, auction) => {
                if (auction == undefined || auction == null || !auction || auction.length == 0) {
                    return message.channel.send("We couldn't find any pokemon associted with that auction ID.");
                }
                else {
                    var update_data = new prompt_model({
                        ChannelID: message.channel.id,
                        PromptType: "ConfirmRemove",
                        UserID: {
                            User1ID: message.author.id
                        },
                        List: {
                            PokemonUID: auction.PokemonUID,
                            AuctionID: auction.AuctionID

                        }
                    });
                    update_data.save().then(() => {
                        return message.channel.send(`Are you sure you want to remove your level ${auction.Level} ${auction.PokemonName}${auction.Shiny == true ? " :star:" : ""} from auction? Type \`\`${prefix}confirmremove\`\` to confirm or \`\`${prefix}cancel\`\` to cancel the removing.`);
                    });
                }
            });
        }
        // For auction listings command
        else if (args[0] == "listings") {
            return arg_parsing(message, args, prefix, "listings")
        }
        // For auction search command.
        else if (args[0] == "search") {
            return arg_parsing(message, args, prefix, "search");
        }
        else return message.channel.send("Invalid command. Type `" + prefix + "help` for a list of commands.");
    });
}

// Function for arg parsing and understanding.
function arg_parsing(message, args, prefix, command) {
    var showiv = false;
    var request_query = [];
    args.shift(); // Remove search from args.
    var order_type = {};

    if (args.length == 0 || (args.length == 1 && args[0] == "--showiv")) {
        if (args.length == 1 && args[0] == "--showiv") showiv = true;
        if (command == "search") {
            auction_model.find({ "Primary": undefined }).limit(20).exec((err, auction) => {
                if (auction == undefined || auction == null || !auction || auction.length == 0) {
                    return message.channel.send("No auction listings found.");
                } else {
                    var embed = new Discord.MessageEmbed();
                    embed.setTitle("PokeFort Auction:");
                    var description = "";
                    for (a = 0; a < auction.length; a++) {
                        description += `Level ${auction[a]["Level"]} ${auction[a]["PokemonName"]}${auction[a].Shiny == true ? " :star:" : ""} | ID: ${auction[a]["AuctionID"]}${showiv == true ? ` | IV: ${auction[a].IVPercentage}% ` : ``} | Price: ${auction[a]["Price"]} Credits\n`;
                    }
                    embed.setDescription(description);
                    embed.setFooter(`To buy this pokemon type ${prefix}auction buy <Pokemon Id>`);
                    return message.channel.send(embed);
                }
            });
        }
        else if (command == "listings" || (args.length == 1 && args[0] == "--showiv")) {
            auction_model.find({ "UserID": message.author.id }).limit(100).exec((err, auction) => {
                if (auction == undefined || auction == null || !auction || auction.length == 0) {
                    return message.channel.send("No auction listings found.");
                } else {
                    var embed = new Discord.MessageEmbed();
                    embed.setTitle("PokeFort Auction:");
                    var description = "";
                    for (a = 0; a < auction.length; a++) {
                        description += `Level ${auction[a]["Level"]} ${auction[a]["PokemonName"]}${auction[a].Shiny == true ? " :star:" : ""} | ID: ${auction[a]["AuctionID"]}${showiv == true ? ` | IV: ${auction[a].IVPercentage}% ` : ``} | Price: ${auction[a]["Price"]} Credits\n`;
                    }
                    embed.setDescription(description);
                    embed.setFooter(`To buy this pokemon type ${prefix}auction buy <Pokemon Id>`);
                    return message.channel.send(embed);
                }
            });
        }
    }
    else {
        // Multi commmand controller.
        var error = [];
        var total_args = args.join(" ").replace(/--/g, ",--").split(",");
        total_args = _.without(total_args, "", " ");
        for (j = 0; j < total_args.length; j++) {
            new_args = total_args[j].split(" ").filter(it => it != "");
            error[0] = new_args[0];
            if (new_args.length == 1 && (_.isEqual(new_args[0], "--s") || _.isEqual(new_args[0], "--shiny"))) { shiny(new_args); }
            else if (new_args.length == 1 && _.isEqual(new_args[0], "--showiv")) { show_iv(new_args); }
            else if (new_args.length == 2 && (_.isEqual(new_args[0], "--t") || _.isEqual(new_args[0], "--type"))) { type(new_args); }
            else if (new_args.length >= 1 && (_.isEqual(new_args[0], "--n") || _.isEqual(new_args[0], "--name"))) { name(new_args); }
            else if (new_args.length >= 1 && (_.isEqual(new_args[0], "--h") || _.isEqual(new_args[0], "--held"))) { held(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--lvl") || _.isEqual(new_args[0], "--level"))) { level(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--iv"))) { iv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--hpiv"))) { hpiv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--atkiv") || _.isEqual(new_args[0], "--attackiv"))) { atkiv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--defiv") || _.isEqual(new_args[0], "--defenseiv"))) { defiv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spatkiv") || _.isEqual(new_args[0], "--specialattackiv"))) { spatkiv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spdefiv") || _.isEqual(new_args[0], "--specialdefenseiv"))) { spdefiv(new_args); }
            else if (new_args.length > 1 && (_.isEqual(new_args[0], "--spdiv") || _.isEqual(new_args[0], "--speediv"))) { spdiv(new_args); }
            else if (new_args.length >= 2 && new_args.length < 4 && (_.isEqual(new_args[0], "--order"))) { order(new_args); }
            else { message.channel.send("Invalid command."); return; }

            // Check if error occurred in previous loop
            if (error.length > 1) {
                message.channel.send(`Error: Argument ${'``' + error[0] + '``'} says ${error[1][1]}`);
                break;
            }
            if (j == total_args.length - 1) {
                if (command == "listings") request_query.unshift({ "UserID": message.author.id });
                auction_model.find({ $and: request_query }).sort(order_type).limit(20).exec((err, auction) => {
                    if (auction == undefined || auction == null || !auction || auction.length == 0) {
                        return message.channel.send("No auction listings found for your search.");
                    } else {
                        var embed = new Discord.MessageEmbed();
                        embed.setTitle("PokeFort Auction:");
                        var description = "";
                        for (a = 0; a < auction.length; a++) {
                            description += `Level ${auction[a]["Level"]} ${auction[a]["PokemonName"]}${auction[a].Shiny == true ? " :star:" : ""} | ID: ${auction[a]["AuctionID"]}${showiv == true ? ` | IV: ${auction[a].IVPercentage}% ` : ``} | Price: ${auction[a]["Price"]} Credits\n`;
                        }
                        embed.setDescription(description);
                        embed.setFooter(`To buy this pokemon type ${prefix}auction buy <Pokemon Id>`);
                        message.channel.send(embed);
                    }
                });
            }
        }

        // For auction --shiny command.
        function shiny(args) {
            request_query.push({ "Shiny": true });
        }

        // For auction --showiv command.
        function show_iv(args) {
            showiv = true;
        }

        // For auction --type command.
        function type(args) {
            request_query.push({ "Type": { $regex: new RegExp(`^${args[1]}`, 'i') } });
        }

        // For auction --name command.
        function name(args) {
            const [, ...name] = args;
            request_query.push({ "PokemonName": { $regex: new RegExp(`^${name.join(" ")}`, 'i') } });
        }

        // For auction --held command.
        function held(args) {
            const [, ...name] = args;
            request_query.push({ "Held": { $regex: new RegExp(`^${name.join(" ")}`, 'i') } });
        }

        // For auction --level command.
        function level(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "Level": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "Level": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "Level": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --iv command.
        function iv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1]) || isFloat(parseFloat(args[1]))) {
                request_query.push({ "IVPercentage": parseFloat(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
                request_query.push({ "IVPercentage": { $gt: parseFloat(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && (isInt(args[2]) || isFloat(parseFloat(args[2])))) {
                request_query.push({ "IVPercentage": { $lt: parseFloat(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --hpiv command.
        function hpiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.0": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.0": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.0": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --atkiv command.
        function atkiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.1": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.1": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.1": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --defiv command.
        function defiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.2": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.2": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.2": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --spatkiv command.
        function spatkiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.3": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.3": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.3": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --spdefiv command.
        function spdefiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.4": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.4": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.4": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --speediv command.
        function spdiv(args) {
            if (args.length == 1) {
                return error[1] = [false, "Please specify a value."]
            }
            else if (args.length == 2 && isInt(args[1])) {
                request_query.push({ "IV.5": parseInt(args[1]) });
            }
            else if (args.length == 3 && args[1] == ">" && isInt(args[2])) {
                request_query.push({ "IV.5": { $gt: parseInt(args[2]) } });
            }
            else if (args.length == 3 && args[1] == "<" && isInt(args[2])) {
                request_query.push({ "IV.5": { $lt: parseInt(args[2]) } });
            }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }

        // For auction --order command.
        function order(args) {
            var order_arrange = "asc";
            if (Object.keys(order_type).length != 0) return error[1] = [false, "You can only use order command once."];
            if (args.length == 3 && (args[2] == "desc" || args[2] == "descending" || args[2] == 'd')) order_arrange = "desc";
            if (args[1].toLowerCase() == "iv") { order_type = { "IVPercentage": order_arrange } }
            else if (args[1].toLowerCase() == "id") { order_type = { "AuctionID": order_arrange } }
            else if (args[1].toLowerCase() == "level" || args[1].toLowerCase() == "lvl") { order_type = { "Level": order_arrange } }
            else if (args[1].toLowerCase() == "name") { order_type = { "PokemonName": order_arrange } }
            else if (args[1].toLowerCase() == "price") { order_type = { "Price": order_arrange } }
            else { return error[1] = [false, "Invalid argument syntax."] }
        }
    }
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

// Calculate percentage of given number.
function percentCalculation(a, b) {
    var c = (parseFloat(a) * parseFloat(b)) / 100;
    return parseFloat(c);
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

// Check if given value is float.
function isFloat(x) { return !!(x % 1); }

module.exports.config = {
    name: "auction",
    aliases: []
}