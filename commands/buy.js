const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const pokemons_model = require('../models/pokemons');
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length < 1) return message.channel.send("Please specify a name to purchase!");

    if (_.startsWith(args[0], "tm")) { return buytm(message, args, pokemons); }
    else return message.channel.send("Please specify a valid name to purchase!");
}

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
                    message.channel.send(`Your level ${selected_pokemon.Level} ${get_pokemon_full_name(selected_pokemon, pokemons)} can now learn ${move_data.name}`);
                });
            });
        })
    })
}

// Get pokemon name from pokemon ID.
function get_pokemon_full_name(selected_pokemon, pokemons) {
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

    //Get Pokemon Name from Pokemon ID.
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

    if (selected_pokemon.Nickname) { var name = `'${selected_pokemon.Nickname}'` }
    else { var name = pokemon_name }

    return name;
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

module.exports.config = {
    name: "buy",
    aliases: []
}