const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const pokemons_model = require('../models/pokemons');
const Discord = require('discord.js');
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());
const forms_config = require('../config/forms.json');

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 1) return message.channel.send("Please specify a name to purchase!");

    if (_.startsWith(args[0], "tm")) { return buytm(message, args, pokemons); }
    else if (args.length == 1 && isInt(args[0]) && args[0] <= 4) { return buyboosters(message, args); }
    else if (args[0].toLowerCase() == "candy") { return buycandy(message, args, pokemons); }
    else if (args[0].toLowerCase() == "nature") { return buynature(message, args, pokemons); }
    else if (args[0].toLowerCase() == "form") { return buyforms(message, args, pokemons); }
    else if (args[0].toLowerCase() == "mega") { return buymega(message, args, pokemons); }
    else if (args[0].toLowerCase() == "stone") { return buystone(message, args, pokemons); }
    else if (args[0].toLowerCase() == "item") { return buyitem(message, args); }
    else return buyevolveitems(message, args, pokemons);
}

// Function to buy trade items.
function buyitem(message, args) {
    args.shift();
    var available_items = ["everstone", "xp blocker", "deep sea scale", "deep sea tooth", "dragon scale", "dubious disc", "electirizer", "kings rock", "magmarizer", "metal coat", "prism scale", "protector", "reaper cloth", "sachet", "upgrade", "whipped dream"];
    if (!available_items.includes(args.join(" ").toLowerCase())) return message.channel.send("Please specify a valid item to purchase!");

    var given_item = args.join(" ").toLowerCase();

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 75) { return message.channel.send("You don't have enough PokeCredits to buy this item!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {
            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;

            if (selected_pokemon.Held != undefined && selected_pokemon.Held != null) return message.channel.send("Your selected pokemon already has an item!");

            user.PokeCredits -= 75;
            // Update database
            pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Held": given_item.capitalize() } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                user.save();
                message.channel.send(`You pokemon is holding ${given_item}!`);
            });

        });
    });
}

// Function to buy evolve items
function buyevolveitems(message, args, pokemons) {
    var evolve_items = ["sweet apple", "tart apple", "cracked pot", "galarica wreath", "galarica cuff", "razor claw", "razon fang", "bracelet"];
    if (!evolve_items.includes(args.join(" ").toLowerCase())) return message.channel.send("Please specify a valid item to purchase!");

    var given_item = args.join(" ").toLowerCase().capitalize();

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 150) { return message.channel.send("You don't have enough PokeCredits to buy this form!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var update_pokemon_id = null;

            if (selected_pokemon.Held == "Everstone") return message.channel.send("You can't evolve this pokemon with held item!");

            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
            if (given_item == "Bracelet" && pokemon_db.Evolution != "NULL") {
                if (message.channel.name == "day") {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == "Day" && it.Reason == "Bracelet")[0];
                        if (evo == undefined) return message.channel.send("Your pokemon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == "Day" ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokemon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
                else if (message.channel.name == "night") {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == "Night" && it.Reason == "Bracelet")[0];
                        if (evo == undefined) return message.channel.send("Your pokemon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == "Night" ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokemon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
                else {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == undefined && it.Reason == "Bracelet")[0];
                        if (evo == undefined) return message.channel.send("Your pokemon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == undefined ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokemon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
            }
            else if (pokemon_db["Evolution Stone"] != undefined) {
                if (pokemon_db["Evolution Stone"].some(it => it.includes(given_item))) update_pokemon_id = pokemon_db["Evolution Stone"].find(it => it.includes(given_item))[1];
                if (update_pokemon_id == null) return message.channel.send("This pokemon can't evolve with this item!");
                if (update_pokemon_id.length == 1 && pokemon_db["Evolution Stone"][0] == given_item) {
                    update_pokemon_id = pokemon_db["Evolution Stone"][1];
                }
                evolve_pokemon(pokemon_db["Pokemon Id"], update_pokemon_id, selected_pokemon.Shiny);
            } else return message.channel.send("This pokemon is not eligible for this item!");

            function evolve_pokemon(old_pokemon_id, new_pokemon_id, shiny) {
                var old_pokemon_name = getPokemons.get_pokemon_name_from_id(old_pokemon_id, pokemons, shiny);
                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(new_pokemon_id, pokemons, shiny);
                user.PokeCredits -= 150;
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": new_pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    user.save();
                    message.channel.send(`Your ${old_pokemon_name} evolved into ${new_pokemon_name}!`);
                    return true;
                });
            }
        });
    });
}

// Function to buy stones.
function buystone(message, args, pokemons) {
    if (args.length > 2) return message.channel.send("Please specify a valid stone to buy!");
    var stones = ["dawn", "dusk", "fire", "ice", "leaf", "moon", "shiny", "sun", "thunder", "water", "oval"];
    if (!stones.includes(args[1].toLowerCase())) return message.channel.send("Please specify a valid stone to buy!");
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 150) { return message.channel.send("You don't have enough PokeCredits to buy this form!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var update_pokemon_id = null;

            if (selected_pokemon.Held == "Everstone") return message.channel.send("You can't evolve this pokemon with held item!");

            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
            if (pokemon_db["Evolution Stone"] != undefined) {
                if (pokemon_db["Evolution Stone"].some(it => it.includes(`${args[1].capitalize()} Stone`))) update_pokemon_id = pokemon_db["Evolution Stone"].find(it => it.includes(`${args[1].capitalize()} Stone`))[1];
                if (update_pokemon_id == null) return message.channel.send("This pokemon can't evolve with this stone!");
                if (update_pokemon_id.length == 1 && pokemon_db["Evolution Stone"][0] == `${args[1].capitalize()} Stone`) {
                    update_pokemon_id = pokemon_db["Evolution Stone"][1];
                }

                var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_db["Pokemon Id"], pokemons, selected_pokemon.Shiny);
                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(update_pokemon_id, pokemons, selected_pokemon.Shiny);
                user.PokeCredits -= 150;
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": update_pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    user.save();
                    message.channel.send(`Your ${old_pokemon_name} evolved into ${new_pokemon_name}!`);
                });
            } else return message.channel.send("This pokemon is not eligible for this stone!");
        });
    });
}

// Function to buy mega.
function buymega(message, args, pokemons) {
    if (args.length > 2) return message.channel.send("Please specify a valid mega form to buy!");
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 1000) { return message.channel.send("You don't have enough PokeCredits to buy this form!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var mega_type = "";

            if (args.length == 1) {
                mega_type = "Mega";
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega") return message.channel.send("Your selected pokemon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && (it["Alternate Form Name"] == "Mega" || it["Alternate Form Name"] == "Primal"))[0];
            }
            else if (args.length == 2 && args[1].toLowerCase() == "x") {
                mega_type = "Mega X";
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega X") return message.channel.send("Your selected pokemon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega X")[0];
            }
            else if (args.length == 2 && args[1].toLowerCase() == "y") {
                mega_type = "Mega Y";
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega Y") return message.channel.send("Your selected pokemon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega Y")[0];
            }
            else return message.channel.send("Please specify a valid mega form to buy!");
            if (pokemon_db == undefined || pokemon_db == null) return message.channel.send("You can't buy this form because selected pokemon is not suitable!");
            else {
                user.PokeCredits -= 1000;
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Mega": mega_type } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    user.save();
                    message.channel.send(`You ${getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny)} is now able to ${mega_type}!`);
                });
            }
        });
    });
}

// Function to buy forms.
function buyforms(message, args, pokemons) {
    if (args.length == 1) return message.channel.send("Please specify a valid form to buy!");
    args.shift();
    if (args[0].toLowerCase() == "normal") args.shift();
    var pokemon_data = getPokemons.getPokemonData(args, pokemons, false);
    if (pokemon_data != null) {
        if (forms_config.available_forms[pokemon_data["Pokemon Name"].toLowerCase()] == undefined || !forms_config.available_forms[pokemon_data["Pokemon Name"].toLowerCase()].forms.includes(pokemon_data["Alternate Form Name"].toLowerCase())) return message.channel.send("No form found in that name!");

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (user.PokeCredits < 1000) { return message.channel.send("You don't have enough PokeCredits to buy this form!"); }

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_id = selected_pokemon.PokemonId;

                if (pokemon_id == pokemon_data["Pokemon Id"]) return message.channel.send("Your selected pokemon is already in this form!");
                else {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    if (pokemon_db["Pokedex Number"] != pokemon_data["Pokedex Number"]) return message.channel.send("You can't buy this form because selected pokemon is not suitable!");
                    else {
                        user.PokeCredits -= 1000;
                        // Update database
                        pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": pokemon_data["Pokemon Id"] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                            if (err) return console.log(err);
                            user.save();
                            message.channel.send(`You pokemon's form changed to ${pokemon_data.fullname}!`);
                        });
                    }
                }
            });
        });
    } else return message.channel.send("No form found in that name!");
}

// Function to buy nature.
function buynature(message, args, pokemons) {
    if (args.length < 2 || args.length > 2) return message.channel.send("Please specify a valid nature to buy!");

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 1000) { return message.channel.send("You don't have enough PokeCredits to buy this nature!"); }

        var available_nature = ["adament", "bashful", "bold", "brave", "calm", "careful", "docile", "gentle", "hardy", "hasty", "impish", "jolly", "lax", "lonely", "mild", "modest", "naive", "naughty", "quiet", "quirky", "rash", "relaxed", "sassy", "serious", "timid"];
        if (available_nature.includes(args[1].toLowerCase())) {

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);
                if (available_nature[selected_pokemon.Nature - 1] == args[1].toLowerCase()) return message.channel.send("This pokemon already has this nature!");

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Nature": available_nature.indexOf(args[1]) + 1 } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);

                    message.channel.send(`You changed the nature of your ${pokemon_name} from ${available_nature[selected_pokemon.Nature - 1].capitalize()} to ${args[1].capitalize()}.`);
                });

                user.PokeCredits -= 1000;
                user.save();
            });
        }
        else return message.channel.send("Please specify a valid nature to buy!");
    });
}

// Function to buy candy.
function buycandy(message, args, pokemons) {
    if (args.length == 1 || args.length > 2) return message.channel.send("Please specify a valid amount to buy candy!");
    if (!isInt(args[1]) || args[1] < 1 || (args[1] > 99 && args[1] < 200) || args[1] > 200) return message.channel.send("Please specify a valid amount to buy candy!");

    var purchased_candy = parseInt(args[1]);
    user_model.findOne({ UserID: message.author.id }, (err, user) => {

        if (user.PokeCredits < 70 * purchased_candy) { return message.channel.send("You don't have enough PokeCredits to buy this candy!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            //#region Update XP
            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var pokemon_level = selected_pokemon.Level;
            var level_to_updated = purchased_candy;

            if (selected_pokemon.Held == "Xp blocker") return message.channel.send("You can't buy candy with held item!");

            //#region Exceptions
            if (pokemon_id == "958" && purchased_candy == 200 && selected_pokemon.Held != "Everstone") {
                user.PokeCredits -= 70 * purchased_candy;
                user.save()
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": "959" } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    var message_string = selected_pokemon.Shiny ? `Your Shiny Karrablast evolved into a Shiny Escavalier` : `Your Karrablast evolved into a Escavalier`;
                    return message.channel.send(message_string);
                });
            }

            else if (pokemon_id == "989" && purchased_candy == 200 && selected_pokemon.Held != "Everstone") {
                user.PokeCredits -= 70 * purchased_candy;
                user.save()
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": "990" } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    var message_string = selected_pokemon.Shiny ? `Your Shiny Shelmet evolved into a Shiny Accelgor` : `Your Shelmet evolved into a Accelgor`;
                    return message.channel.send(message_string);
                });
            }
            //#endregion
            else {
                if (pokemon_level == 100 || pokemon_level > 100) {
                    return message.channel.send("This pokemon reached max level!");
                }

                if (pokemon_level + purchased_candy > 100) {
                    level_to_updated = 100 - pokemon_level;
                    purchased_candy = level_to_updated;
                    message.channel.send(`Your Pokemon reached max level with ${level_to_updated} candy(s).\nPurchased only ${level_to_updated} candy(s)!`);
                }

                var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                var evolved = false;
                var new_evolved_name = "";

                while (level_to_updated > 0) {

                    //Update level and send message.
                    pokemon_level += 1;
                    level_to_updated -= 1;

                    if (pokemon_level == 100) {
                        pokemon_level = 100;
                        break;
                    }

                    // Get pokemon evolution.
                    var pokemon_data = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
                    //Exections for Tyrogue
                    if (pokemon_id == "360" && pokemon_level >= 20) {
                        var ev = 0;
                        let atk = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[1] + _.floor(0.25 * ev)) * pokemon_level) + 5);
                        let def = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[2] + _.floor(0.25 * ev)) * pokemon_level) + 5);

                        if (atk > def) next_evolutions[0] = "140";
                        else if (atk < def) next_evolutions[0] = "141";
                        else next_evolutions[0] = "361";
                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(next_evolutions[0], pokemons, selected_pokemon.Shiny);
                        pokemon_id = next_evolutions[0];
                        evolved = true;
                        new_evolved_name = new_pokemon_name;

                    }
                    else {
                        if (pokemon_data.Evolution != "NULL" && pokemon_data.Evolution.Reason == "Level") {
                            if (pokemon_level >= pokemon_data.Evolution.Level) {
                                if (pokemon_data.Evolution.Time == undefined || (pokemon_data.Evolution.Time != undefined && pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase())) {

                                    // Double evolution check.
                                    var double_pokemon_data = pokemons.filter(it => it["Pokemon Id"] == pokemon_data.Evolution.Id)[0];

                                    if ((double_pokemon_data.Evolution != "NULL" && double_pokemon_data.Evolution.Reason == "Level" && pokemon_level >= double_pokemon_data.Evolution.Level) && (double_pokemon_data.Evolution.Time == undefined || (double_pokemon_data.Evolution.Time != undefined && double_pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase()))) {
                                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(double_pokemon_data.Evolution.Id, pokemons, selected_pokemon.Shiny);
                                        pokemon_id = double_pokemon_data.Evolution.Id;
                                    }
                                    else {
                                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_data.Evolution.Id, pokemons, selected_pokemon.Shiny);
                                        pokemon_id = pokemon_data.Evolution.Id;
                                    }
                                    evolved = true;
                                    new_evolved_name = new_pokemon_name;
                                }
                            }
                        }
                    }
                }

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Experience": 0, "Pokemons.$[elem].Level": pokemon_level, "Pokemons.$[elem].PokemonId": pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                });
                //#endregion

                if (evolved) message.channel.send(`${old_pokemon_name} evolved into ${new_evolved_name}!\nYour ${new_evolved_name} is now level ${pokemon_level}!`);
                else message.channel.send(`Your ${old_pokemon_name} is now level ${pokemon_level}!`);

                user.PokeCredits -= 70 * purchased_candy;
                user.save()
            }
        });
    });
}

// Function to buy boosters.
function buyboosters(message, args) {

    function not_enough_credits() {
        return message.channel.send("You don't have enough PokeCredits to buy this booster!");
    }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {

        // Check for active boosters.
        if (user.Boosters != undefined) {
            var old_date = user.Boosters.Timestamp;
            var new_date = new Date();
            var hours = Math.abs(old_date - new_date) / 36e5;
            if (hours < user.Boosters.Hours) { return message.channel.send("You already have an active booster!"); }
        }

        if (args[0] == 1) {
            if (user.PokeCredits < 20) not_enough_credits();
            user.PokeCredits -= 20;
            user.Boosters = {
                Hours: 0.5,
                Level: 2,
            }
        }
        else if (args[0] == 2) {
            if (user.PokeCredits < 40) not_enough_credits();
            user.PokeCredits -= 50;
            user.Boosters = {
                Hours: 1,
                Level: 2,
            }
        }
        else if (args[0] == 3) {
            if (user.PokeCredits < 75) not_enough_credits();
            user.PokeCredits -= 75;
            user.Boosters = {
                Hours: 2,
                Level: 2,
            }
        }
        else if (args[0] == 4) {
            if (user.PokeCredits < 90) not_enough_credits();
            user.PokeCredits -= 90;
            user.Boosters = {
                Hours: 4,
                Level: 1.5,
            }
        }
        user.Boosters.Timestamp = Date.now();
        user.save().then(() => {
            if (user.Boosters.Hours == 0.5) var hour_dialog = "30 Minutes";
            else var hour_dialog = `${user.Boosters.Hours} Hours`;
            message.channel.send(`Your XP gain will now be multiplied by ${user.Boosters.Level} for the next ${hour_dialog}!`);
        });
    });
}

// Function to buy TM Moves.
function buytm(message, args, pokemons) {
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (user.PokeCredits < 500) return message.channel.send("You don't have enough PokeCredits to buy this TM!");
        getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
            var user_pokemons = pokemons_from_database;
            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var pokemon_moveset = get_pokemon_move(selected_pokemon.PokemonId, pokemons);
            if (pokemon_moveset.length == 0) return message.channel.send("No TM found for this pokemon.");
            args[0] = parseInt(args[0].replace(/\D/g, ''));
            var purchased_move = pokemon_moveset.filter(it => it[0] == args[0])[0];
            if (purchased_move == undefined || purchased_move.length < 1) return message.channel.send("Please specify a valid TM to purchase!");

            var move_data = movesparser.tmdata(purchased_move[0]);
            if (selected_pokemon.TmMoves.includes(move_data.num)) return message.channel.send("You already have this TM!");

            selected_pokemon.TmMoves.push(move_data.num);
            user.PokeCredits -= 500;

            user.save().then(() => {
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].TmMoves": selected_pokemon.TmMoves } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    message.channel.send(`Your level ${selected_pokemon.Level} ${getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons)} can now learn ${move_data.name}`);
                });
            });
        })
    })
}

// Get pokemon name from pokemon ID.
function get_pokemon_move(pokemon_id, pokemons) {
    var moveset = [];
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];

    if (pokemon_db["Alternate Form Name"] == "Alola") {
        temp_name = pokemon_db["Pokemon Name"] + "alola";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    else if (pokemon_db["Alternate Form Name"] == "Galar") {
        temp_name = pokemon_db["Pokemon Name"] + "galar";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    else {
        temp_name = pokemon_db["Pokemon Name"];
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.tmmoves(learnset);
    }
    return moveset;
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
    name: "buy",
    aliases: []
}