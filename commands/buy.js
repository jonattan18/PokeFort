const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const pokemons_model = require('../models/pokemons');
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');
const pokemons = require('../models/pokemons');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 1) return message.channel.send("Please specify a name to purchase!");

    if (_.startsWith(args[0], "tm")) { return buytm(message, args, pokemons); }
    else if (args.length == 1 && isInt(args[0]) && args[0] <= 4) { return buyboosters(message, args); }
    else if (args[0].toLowerCase() == "candy") { return buycandy(message, args, pokemons); }
    else return message.channel.send("Please specify a valid item to purchase!");
}

// Function to buy candy.
function buycandy(message, args, pokemons) {
    if (args.length == 1 || args.length > 2) return message.channel.send("Please specify a valid amount to buy candy!");
    if (!isInt(args[1]) || args[1] < 1 || args[1] > 99) return message.channel.send("Please specify a valid amount to buy candy!");

    var purchased_candy = args[1];
    user_model.findOne({ UserID: message.author.id }, (err, user) => {

        if (user.PokeCredits < 70 * args[1]) { return message.channel.send("You don't have enough PokeCredits to buy this candy!"); }

        // Get all user pokemons.
        getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

            //#region Update XP
            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
            var _id = selected_pokemon._id;
            var pokemon_id = selected_pokemon.PokemonId;
            var pokemon_level = selected_pokemon.Level;
            var level_to_updated = purchased_candy;

            if (pokemon_level == 100 || pokemon_level > 100) {
                return message.channel.send("This pokemon reached max level!");
            }

            if (pokemon_level + level_to_updated > 100) {
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
                var evo_tree = evolution_tree(pokemons, pokemon_id);
                var next_evolutions = evo_tree.filter(it => it[0] > pokemon_id && it[1].includes('Level'));
                if (next_evolutions != undefined && next_evolutions.length > 0) {
                    next_evolutions = next_evolutions[0];
                    var required_level = next_evolutions[1].match(/\d/g).join("");
                    if (pokemon_level >= required_level) {
                        var new_pokemon_name = getPokemons.get_pokemon_name_from_id(next_evolutions[0], pokemons, selected_pokemon.Shiny, true);
                        pokemon_id = next_evolutions[0];
                        evolved = true;
                        new_evolved_name = new_pokemon_name;
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
            // user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Boosters": user.Booster } }, (err, user_data) => {
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

// Get evolution tree of pokemons.
function evolution_tree(pokemons, pokemon_id) {
    var filtered_pokemons = [];
    var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Id"] == pokemon_id)[0];
    if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
    filtered_pokemons.push(parseInt(found_pokemon["Pokemon Id"]));

    var pre_evolution = pokemons.filter(it => it["Pokemon Id"] === found_pokemon["Pre-Evolution Pokemon Id"].toString())[0];
    if (pre_evolution) filtered_pokemons.push([parseInt(pre_evolution["Pokemon Id"]), pre_evolution["Evolution Details"]]);

    var pre_pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
    if (pre_pre_evolution) filtered_pokemons.push([parseInt(pre_pre_evolution["Pokemon Id"]), pre_pre_evolution["Evolution Details"]]);

    if (pre_evolution) var post_evolution = pokemons.filter(it => it["Pokemon Id"] === pre_evolution["Pre-Evolution Pokemon Id"].toString())[0];
    if (post_evolution) filtered_pokemons.push([parseInt(post_evolution["Pokemon Id"]), post_evolution["Evolution Details"]]);

    if (pre_pre_evolution) var post_post_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pre_pre_evolution["Pokemon Id"]))[0];
    if (post_post_evolution) filtered_pokemons.push([parseInt(post_post_evolution["Pokemon Id"]), post_post_evolution["Evolution Details"]]);

    return filtered_pokemons;
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