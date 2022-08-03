const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const pokemons_model = require('../models/pokemons');
const Discord = require('discord.js');
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const forms_config = require('../config/forms.json');

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 1) return message.channel.send("Please specify a name to purchase!");

    if (_.startsWith(args[0].toLowerCase(), "tm")) { return buytm(message, args, pokemons); }
    else if (args.length == 1 && isInt(args[0]) && args[0] <= 4) { return buyboosters(message, args); }
    else if (args[0].toLowerCase() == "candy") { return buycandy(message, args, pokemons); }
    else if (args[0].toLowerCase() == "nature") { return buynature(message, args, pokemons); }
    else if (args[0].toLowerCase() == "form") { return buyforms(message, args, pokemons); }
    else if (args[0].toLowerCase() == "mega") { return buymega(message, args, pokemons); }
    else if (args[0].toLowerCase() == "stone") { return buystone(message, args, pokemons); }
    else if (args[0].toLowerCase() == "item") { return buyitem(message, args); }
    else if (args[0].toLowerCase() == "wing") { return buywing(message, args, pokemons); }
    else if (args[0].toLowerCase() == "vitamin") { return buyvitamin(message, args, pokemons); }
    else if (args[0].toLowerCase() == "berry") { return buyberry(message, args, pokemons); }
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

            if (selected_pokemon.Held != undefined && selected_pokemon.Held != null) return message.channel.send("Your selected pokémon already has an item!");

            user.PokeCredits -= 75;
            // Update database
            pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Held": given_item.capitalize() } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                user.save();
                message.channel.send(`Your pokémon is holding ${given_item}!`);
            });

        });
    });
}

// Function to buy evolve items
function buyevolveitems(message, args, pokemons) {
    var evolve_items = ["sweet apple", "tart apple", "cracked pot", "galarica wreath", "galarica cuff", "razor claw", "razor fang", "bracelet"];
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

            if (selected_pokemon.Held == "Everstone") return message.channel.send("You can't evolve this pokémon with held item!");

            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
            if (pokemon_db.Evolution != "NULL") {
                if (message.channel.name == "day") {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == "Day" && it.Reason == given_item)[0];
                        if (evo == undefined) return message.channel.send("Your pokémon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == "Day" ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokémon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
                else if (message.channel.name == "night") {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == "Night" && it.Reason == given_item)[0];
                        if (evo == undefined) return message.channel.send("Your pokémon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == "Night" ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokémon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
                else {
                    if (_.isArray(pokemon_db.Evolution)) {
                        var evo = pokemon_db.Evolution.filter(it => it.Time == undefined && it.Reason == given_item)[0];
                        if (evo == undefined) return message.channel.send("Your pokémon neglected this item!");
                        var evo_id = evo.Id;
                    }
                    else {
                        var evo_id = pokemon_db.Evolution.Time == undefined ? pokemon_db.Evolution.Id : undefined;
                        if (evo_id == undefined) return message.channel.send("Your pokémon neglected this item!");
                    }
                    evolve_pokemon(pokemon_db["Pokemon Id"], evo_id, selected_pokemon.Shiny);
                }
            } else return message.channel.send("Your pokémon doesn't suit for this item!");

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
    var stones = ["dawn", "dusk", "fire", "ice", "leaf", "moon", "shiny", "sun", "thunder", "water", "oval", "black augurite", "peat block"];
    args.shift();
    var stone_name = args.join(" ").toLowerCase();
    if (!stones.includes(stone_name.toLowerCase())) return message.channel.send("Please specify a valid stone to buy!");
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < 150) { return message.channel.send("You don't have enough PokeCredits to buy this form!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var update_pokemon_id = null;

            if (selected_pokemon.Held == "Everstone") return message.channel.send("You can't evolve this pokémon with held item!");

            var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
            if (pokemon_db["Evolution Stone"] != undefined) {
                if (pokemon_db["Evolution Stone"].some(it => it.includes(`${stone_name.capitalize()} Stone`))) update_pokemon_id = pokemon_db["Evolution Stone"].find(it => it.includes(`${stone_name.capitalize()} Stone`))[1];
                if (update_pokemon_id == null) return message.channel.send("This pokémon can't evolve with this stone!");
                if (update_pokemon_id.length == 1 && pokemon_db["Evolution Stone"][0] == `${stone_name.capitalize()} Stone`) {
                    if (pokemon_db["Evolution Stone"][2] != undefined) {
                        if (message.channel.name != pokemon_db["Evolution Stone"][2].toLowerCase()) return message.channel.send("Your pokémon neglected this stone!");
                    }
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
            } else return message.channel.send("This pokémon is not eligible for this stone!");
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
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega") return message.channel.send("Your selected pokémon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && (it["Alternate Form Name"] == "Mega" || it["Alternate Form Name"] == "Primal"))[0];
            }
            else if (args.length == 2 && args[1].toLowerCase() == "x") {
                mega_type = "Mega X";
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega X") return message.channel.send("Your selected pokémon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega X")[0];
            }
            else if (args.length == 2 && args[1].toLowerCase() == "y") {
                mega_type = "Mega Y";
                if (selected_pokemon.Mega != undefined && selected_pokemon.Mega == "Mega Y") return message.channel.send("Your selected pokémon is already Mega!");
                var temp_pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                var pokemon_db = pokemons.filter(it => it["Pokedex Number"] == temp_pokemon_db["Pokedex Number"] && it["Alternate Form Name"] == "Mega Y")[0];
            }
            else return message.channel.send("Please specify a valid mega form to buy!");
            if (pokemon_db == undefined || pokemon_db == null) return message.channel.send("You can't buy this form because selected pokémon is not suitable!");
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

                if (pokemon_id == pokemon_data["Pokemon Id"]) return message.channel.send("Your selected pokémon is already in this form!");
                else {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];
                    if (pokemon_db["Pokedex Number"] != pokemon_data["Pokedex Number"]) return message.channel.send("You can't buy this form because selected pokémon is not suitable!");
                    else {
                        user.PokeCredits -= 1000;
                        // Update database
                        pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].PokemonId": pokemon_data["Pokemon Id"] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                            if (err) return console.log(err);
                            user.save();
                            message.channel.send(`Your pokemon's form changed to ${pokemon_data.fullname}!`);
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

        var available_nature = ["adamant", "bashful", "bold", "brave", "calm", "careful", "docile", "gentle", "hardy", "hasty", "impish", "jolly", "lax", "lonely", "mild", "modest", "naive", "naughty", "quiet", "quirky", "rash", "relaxed", "sassy", "serious", "timid"];
        if (available_nature.includes(args[1].toLowerCase())) {

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);
                if (available_nature[selected_pokemon.Nature - 1] == args[1].toLowerCase()) return message.channel.send("This pokémon already has this nature!");

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
                var final_message = "";
                if (pokemon_level == 100 || pokemon_level > 100) {
                    return message.channel.send("This pokémon reached max level!");
                }

                if (pokemon_level + purchased_candy > 100) {
                    level_to_updated = 100 - pokemon_level;
                    purchased_candy = level_to_updated;
                    final_message = `Your Pokémon reached max level with ${level_to_updated} candy(s).\nPurchased only ${level_to_updated} candy(s)!\n`
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

                    if (selected_pokemon.Held != "Everstone") {
                        // Get pokemon evolution.
                        var pokemon_data = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
                        //Exections for Tyrogue
                        if (pokemon_id == "360" && pokemon_level >= 20) {
                            var ev = 0;
                            let atk = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[1] + _.floor(0.25 * ev)) * pokemon_level) + 5);
                            let def = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[2] + _.floor(0.25 * ev)) * pokemon_level) + 5);

                            if (atk > def) pokemon_id = "140";
                            else if (atk < def) pokemon_id = "141";
                            else pokemon_id = "361";
                            var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                            evolved = true;
                            new_evolved_name = new_pokemon_name;

                        }
                        //Exception for cosmoem
                        else if (pokemon_id == "1320" && pokemon_level >= 53) {
                            if (message.channel.name == "day") { evolved = true; pokemon_id = "1321"; }
                            else if (message.channel.name == "night") { evolved = true; pokemon_id = "1322"; }

                            if (evolved) {
                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                                new_evolved_name = new_pokemon_name;
                            }
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
                }

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Experience": 0, "Pokemons.$[elem].Level": pokemon_level, "Pokemons.$[elem].PokemonId": pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                });
                //#endregion

                if (evolved) final_message += `${old_pokemon_name} evolved into ${new_evolved_name}!\nYour ${new_evolved_name} is now level ${pokemon_level}!`;
                else final_message += `Your ${old_pokemon_name} is now level ${pokemon_level}!`;

                message.channel.send(final_message);

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

// Function to buy Wings.
function buywing(message, args, pokemons, amount = 1) {
    if (args.length < 2 || args.length > 3) return message.channel.send("Please specify a valid wing to buy!");

    if (args.length == 3 && isInt(args[2])) {
        amount = parseInt(args[2]);
    }

    if (amount < 1 || amount > 260) return message.channel.send("Please specify a valid amount of wings to buy!");

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < (20 * amount)) { return message.channel.send("You don't have enough PokeCredits to buy this wing!"); }

        var available_wings = ["health", "muscle", "resist", "genius", "clever", "swift"];
        if (available_wings.includes(args[1].toLowerCase())) {

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);

                // Get Evs of current pokemon.
                var evs = selected_pokemon.EV != undefined ? selected_pokemon.EV : [];
                var hp_ev = evs[0] != undefined ? evs[0] : 0;
                var attack_ev = evs[1] != undefined ? evs[1] : 0;
                var defense_ev = evs[2] != undefined ? evs[2] : 0;
                var spattack_ev = evs[3] != undefined ? evs[3] : 0;
                var spdefense_ev = evs[4] != undefined ? evs[4] : 0;
                var speed_ev = evs[5] != undefined ? evs[5] : 0;
                var total_ev = hp_ev + attack_ev + defense_ev + spattack_ev + spdefense_ev + speed_ev;

                if (total_ev >= 510) return message.channel.send("This pokémon already has the maximum amount of EVs!");
                var ev_changes = [];

                // Health Ev
                if (args[1].toLowerCase() == "health") {
                    ev_changes = ["Health", hp_ev];
                    hp_ev += 1 * amount;
                    ev_changes.push(hp_ev);
                }
                // Defense Ev
                else if (args[1].toLowerCase() == "muscle") {
                    ev_changes = ["Attack", attack_ev];
                    attack_ev += 1 * amount;
                    ev_changes.push(attack_ev);
                }
                // Attack Ev
                else if (args[1].toLowerCase() == "resist") {
                    ev_changes = ["Defense", defense_ev];
                    defense_ev += 1 * amount;
                    ev_changes.push(defense_ev);
                }
                // SpAttack Ev
                else if (args[1].toLowerCase() == "genius") {
                    ev_changes = ["Special Attack", spattack_ev];
                    spattack_ev += 1 * amount;
                    ev_changes.push(spattack_ev);
                }
                // SpDefense Ev
                else if (args[1].toLowerCase() == "clever") {
                    ev_changes = ["Special Defense", spdefense_ev];
                    spdefense_ev += 1 * amount;
                    ev_changes.push(spdefense_ev);
                }
                // Speed Ev
                else if (args[1].toLowerCase() == "swift") {
                    ev_changes = ["Speed", speed_ev];
                    speed_ev += 1 * amount;
                    ev_changes.push(speed_ev);
                }

                // Individual EV check.
                for (var i = 0; i < ev_changes.length; i++) {
                    if (ev_changes[i] > 252) return message.channel.send("This pokémon can't get higher than maximum stat!");
                }

                // Ev total check.
                var changed_total_ev = hp_ev + attack_ev + defense_ev + spattack_ev + spdefense_ev + speed_ev;
                if (changed_total_ev > 510) return message.channel.send("Unable to add EV to this pokémon! It exceeds the maximum amount of EVs!");

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].EV": [hp_ev, attack_ev, defense_ev, spattack_ev, spdefense_ev, speed_ev] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    message.channel.send(`You increased your ${pokemon_name}'s ${ev_changes[0]} EV stat from ${ev_changes[1]} to ${ev_changes[2]}.`);
                });

                user.PokeCredits -= 20 * amount;
                user.save();
            });
        }
        else return message.channel.send("Please specify a valid wing to buy!");
    });
}

// Function to buy vitamins.
function buyvitamin(message, args, pokemons, amount = 1) {
    if (args.length < 2 || args.length > 3) return message.channel.send("Please specify a valid vitamin to buy!");

    if (args.length == 3 && isInt(args[2])) {
        amount = parseInt(args[2]);
    }

    if (amount < 1 || amount > 100) return message.channel.send("Please specify a valid amount of vitamins to buy!");

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < (150 * amount)) { return message.channel.send("You don't have enough PokeCredits to buy this vitamin!"); }

        var available_vitamin = ["hp-up", "protein", "iron", "calcium", "zinc", "carbos"];
        if (available_vitamin.includes(args[1].toLowerCase())) {

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);

                // Get Evs of current pokemon.
                var evs = selected_pokemon.EV != undefined ? selected_pokemon.EV : [];
                var hp_ev = evs[0] != undefined ? evs[0] : 0;
                var attack_ev = evs[1] != undefined ? evs[1] : 0;
                var defense_ev = evs[2] != undefined ? evs[2] : 0;
                var spattack_ev = evs[3] != undefined ? evs[3] : 0;
                var spdefense_ev = evs[4] != undefined ? evs[4] : 0;
                var speed_ev = evs[5] != undefined ? evs[5] : 0;
                var total_ev = hp_ev + attack_ev + defense_ev + spattack_ev + spdefense_ev + speed_ev;

                if (total_ev >= 510) return message.channel.send("This pokémon already has the maximum amount of EVs!");
                var ev_changes = [];

                // Health Ev
                if (args[1].toLowerCase() == "hp-up") {
                    ev_changes = ["Health", hp_ev];
                    hp_ev += 10 * amount;
                    ev_changes.push(hp_ev);
                }
                // Defense Ev
                else if (args[1].toLowerCase() == "protein") {
                    ev_changes = ["Attack", attack_ev];
                    attack_ev += 10 * amount;
                    ev_changes.push(attack_ev);
                }
                // Attack Ev
                else if (args[1].toLowerCase() == "iron") {
                    ev_changes = ["Defense", defense_ev];
                    defense_ev += 10 * amount;
                    ev_changes.push(defense_ev);
                }
                // SpAttack Ev
                else if (args[1].toLowerCase() == "calcium") {
                    ev_changes = ["Special Attack", spattack_ev];
                    spattack_ev += 10 * amount;
                    ev_changes.push(spattack_ev);
                }
                // SpDefense Ev
                else if (args[1].toLowerCase() == "zinc") {
                    ev_changes = ["Special Defense", spdefense_ev];
                    spdefense_ev += 10 * amount;
                    ev_changes.push(spdefense_ev);
                }
                // Speed Ev
                else if (args[1].toLowerCase() == "carbos") {
                    ev_changes = ["Speed", speed_ev];
                    speed_ev += 10 * amount;
                    ev_changes.push(speed_ev);
                }

                // Individual EV check.
                for (var i = 0; i < ev_changes.length; i++) {
                    if (ev_changes[i] > 252) return message.channel.send("This pokémon can't get higher than maximum stat!");
                }

                // Ev total check.
                var changed_total_ev = hp_ev + attack_ev + defense_ev + spattack_ev + spdefense_ev + speed_ev;
                if (changed_total_ev > 510) return message.channel.send("Unable to add EV to this pokémon! It exceeds the maximum amount of EVs!");

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].EV": [hp_ev, attack_ev, defense_ev, spattack_ev, spdefense_ev, speed_ev] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    message.channel.send(`You increased your ${pokemon_name}'s ${ev_changes[0]} EV stat from ${ev_changes[1]} to ${ev_changes[2]}.`);
                });

                user.PokeCredits -= 150 * amount;
                user.save();
            });
        }
        else return message.channel.send("Please specify a valid vitamin to buy!");
    });
}

// Function to buy berry.
function buyberry(message, args, pokemons, amount = 1) {
    if (args.length < 2 || args.length > 3) return message.channel.send("Please specify a valid berry to buy!");

    if (args.length == 3 && isInt(args[2])) {
        amount = parseInt(args[2]);
    }

    if (amount < 1 || amount > 100) return message.channel.send("Please specify a valid amount of berrys to buy!");

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.PokeCredits < (50 * amount)) { return message.channel.send("You don't have enough PokeCredits to buy this berry!"); }

        var available_berry = ["pomeg", "kelpsy", "qualot", "hondew", "grepa", "tamato"];
        if (available_berry.includes(args[1].toLowerCase())) {

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, selected_pokemon.Shiny);

                // Get Evs of current pokemon.
                var evs = selected_pokemon.EV != undefined ? selected_pokemon.EV : [];
                var hp_ev = evs[0] != undefined ? evs[0] : 0;
                var attack_ev = evs[1] != undefined ? evs[1] : 0;
                var defense_ev = evs[2] != undefined ? evs[2] : 0;
                var spattack_ev = evs[3] != undefined ? evs[3] : 0;
                var spdefense_ev = evs[4] != undefined ? evs[4] : 0;
                var speed_ev = evs[5] != undefined ? evs[5] : 0;
                var ev_changes = [];

                // Health Ev
                if (args[1].toLowerCase() == "pomeg") {
                    ev_changes = ["Health", hp_ev];
                    hp_ev -= 10 * amount;
                    ev_changes.push(hp_ev);
                }
                // Defense Ev
                else if (args[1].toLowerCase() == "kelpsy") {
                    ev_changes = ["Attack", attack_ev];
                    attack_ev -= 10 * amount;
                    ev_changes.push(attack_ev);
                }
                // Attack Ev
                else if (args[1].toLowerCase() == "qualot") {
                    ev_changes = ["Defense", defense_ev];
                    defense_ev -= 10 * amount;
                    ev_changes.push(defense_ev);
                }
                // SpAttack Ev
                else if (args[1].toLowerCase() == "hondew") {
                    ev_changes = ["Special Attack", spattack_ev];
                    spattack_ev -= 10 * amount;
                    ev_changes.push(spattack_ev);
                }
                // SpDefense Ev
                else if (args[1].toLowerCase() == "grepa") {
                    ev_changes = ["Special Defense", spdefense_ev];
                    spdefense_ev -= 10 * amount;
                    ev_changes.push(spdefense_ev);
                }
                // Speed Ev
                else if (args[1].toLowerCase() == "tamato") {
                    ev_changes = ["Speed", speed_ev];
                    speed_ev -= 10 * amount;
                    ev_changes.push(speed_ev);
                }

                // Individual EV check.
                for (var i = 0; i < ev_changes.length; i++) {
                    if (ev_changes[i] < 0) return message.channel.send("This pokémon can't get lower than minimum stat!");
                    if (ev_changes[i] > 252) return message.channel.send("This pokémon can't get higher than maximum stat!");
                }

                // Ev total check.
                var changed_total_ev = hp_ev + attack_ev + defense_ev + spattack_ev + spdefense_ev + speed_ev;
                if (changed_total_ev > 510) return message.channel.send("Unable to add EV to this pokémon! It exceeds the maximum amount of EVs!");
                if (changed_total_ev < 0) return message.channel.send("Evs can't be in negative!");

                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].EV": [hp_ev, attack_ev, defense_ev, spattack_ev, spdefense_ev, speed_ev] } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                    message.channel.send(`You decreased your ${pokemon_name}'s ${ev_changes[0]} EV stat from ${ev_changes[1]} to ${ev_changes[2]}.`);
                });

                user.PokeCredits -= 50 * amount;
                user.save();
            });
        }
        else return message.channel.send("Please specify a valid berry to buy!");
    });
}

// Function to buy TM Moves.
function buytm(message, args, pokemons) {
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (user.PokeCredits < 500) return message.channel.send("You don't have enough PokeCredits to buy this TM!");
        if (args[0].length != 5 || args[0].substring(0, 2).toLowerCase() != "tm" || !isInt(args[0].substring(2, 5))) return message.channel.send("Unable to find this TM move.")
        getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
            var user_pokemons = pokemons_from_database;
            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var pokemon_moveset = movesparser.get_pokemon_move_from_id(selected_pokemon.PokemonId, pokemons, true);
            if (pokemon_moveset.length == 0) return message.channel.send("No TM found for this pokemon.");
            args[0] = parseInt(args[0].replace(/\D/g, ''));
            var purchased_move = pokemon_moveset.filter(it => it[0] == args[0])[0];
            if (purchased_move == undefined || purchased_move.length < 1) return message.channel.send("Please specify a valid TM to purchase!");

            var move_data = movesparser.tmdata(purchased_move[0]);
            if (selected_pokemon.TmMoves.includes(move_data.num)) return message.channel.send("You already have this TM!");

            selected_pokemon.TmMoves.push(move_data.num);
            user.PokeCredits -= 500;

            pokemons_model.findOneAndUpdate({ 'Pokemons._id': selected_pokemon._id }, { $set: { "Pokemons.$[elem].TmMoves": selected_pokemon.TmMoves } }, { arrayFilters: [{ 'elem._id': selected_pokemon._id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
                user.save();
                message.channel.send(`Your level ${selected_pokemon.Level} ${getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons)} can now learn ${move_data.name}`);
            });
        })
    })
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