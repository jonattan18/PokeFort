// Load Model Data.
const pokemons_model = require('../models/pokemons');

// Load Config Data.
const config = require('../config/config.json');
const mongoose = require('mongoose');

// Function to get all pokemons from a given user id.
let getallpokemon = (UserID) => new Promise((resolve, reject) => {
    pokemons_model.find({ UserID: UserID }).exec(function (err, pokemon_data) {
        if (err) reject(err);
        var total_pokemons = [];
        for (i = 0; i < pokemon_data.length; i++) {
            for (j = 0; j < pokemon_data[i].Pokemons.length; j++) {
                total_pokemons.push(pokemon_data[i].Pokemons[j]);
            }
        }
        resolve(total_pokemons);
    });
    setTimeout(resolve, 5000);
});

// Function to insert a pokemon to user id.
let insertpokemon = (UserID, Pokemons) => new Promise((resolve, reject) => {
    pokemons_model.find({ UserID: UserID }).sort({ _id: -1 }).limit(1).exec(function (err, pokemon_data) {
        if (err) reject(err);

        // No database found. Create new and insert pokemons.
        if (pokemon_data.length == 0) {
            let new_pokemon_database = new pokemons_model({
                UserID: UserID,
                Pokemons: [Pokemons]
            });
            new_pokemon_database.save(function (err, saved) {
                if (err) reject(err);
                resolve(saved);
            });
        }

        // Database found. But pokemons slot are full.
        else if (config.POKEMON_IN_SLOT <= pokemon_data[0].Pokemons.length) {
            // Create new pokemon document for same user id.
            let new_pokemon_database = new pokemons_model({
                UserID: UserID,
                Pokemons: [Pokemons]
            });
            new_pokemon_database.save(function (err, saved) {
                if (err) reject(err);
                resolve(saved);
            });
        }

        // Database found. But pokemons slot are not full.
        else {
            // Push new pokemons to database.
            pokemons_model.findOneAndUpdate({ _id: pokemon_data[0]._id }, { $push: { Pokemons: Pokemons } }, function (err, updated) {
                if (err) reject(err);
                resolve(updated);
            });
        }
    });
    setTimeout(resolve, 5000);
});

// Function to delete a pokemon from user id.
let deletepokemon = (PokemonIds) => new Promise((resolve, reject) => {
    pokemons_model.updateMany({}, { $pull: { "Pokemons": { _id: { $in: PokemonIds } } } }, (err, pokemon) => {
        if (err) reject(err);
        resolve(pokemon);
    });
    setTimeout(resolve, 5000);
});

function pokemondata(args, pokemons) {
    if (args.length > 0) {
        // Forms
        var isshiny = false;
        var form = [];
        if (args[0].toLowerCase() == "shiny") { form.push("Shiny"); args.splice(0, 1); if (args[0] == undefined) { message.channel.send("That is not a valid pokemon!"); return; } }
        if (args[0].toLowerCase() == "alolan") { form.push("Alola"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "galarian") { form.push("Galar"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "gigantamax") { form.push("Gigantamax"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "eternamax") { form.push("Eternamax"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "primal") { form.push("Primal"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "mega" && args[args.length - 1].toLowerCase() == "x" || args[args.length - 1].toLowerCase() == "y") {
            if (args[args.length - 1] == "x") { form.push("Mega X") };
            if (args[args.length - 1] == "y") { form.push("Mega Y") };
            args.splice(0, 1);
            args.splice(args.length - 1, 1)
        }
        else if (args[0].toLowerCase() == "mega") { form.push("Mega"); args.splice(0, 1) }

        if (form.length == 1) { form = form[0] }
        else if (form.length == 2) { form = form[1]; isshiny = true; }

        let given_name = args.join(" ")._normalize();

        if (form == "" || form == "Shiny") {
            var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name); // Searching in English Name.
            if (pokemon.length == 0) {
                dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name); // Searching in Germany Name.
                jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name)); // Searching in Japanese Name.
                fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name); // Searching in French Name.
                if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) { message.channel.send("That is not a valid pokemon!"); return; };
            }
        }
        else {
            var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in English Name.
            if (pokemon.length == 0) {
                dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in Germany Name.
                jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name) && it["Alternate Form Name"] === form); // Searching in Japanese Name.
                fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in French Name.
                if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) { message.channel.send("That is not a valid pokemon!"); return; };
            }
        }

        function language_finder(dr_pokemon, jp_pokemon, fr_pokemon) {
            if (dr_pokemon.length > 0) { pokemon = dr_pokemon; }
            else if (jp_pokemon.length > 0) { pokemon = jp_pokemon; }
            else if (fr_pokemon.length > 0) { pokemon = fr_pokemon; }
            else { return false; }
        }

        pokemon = pokemon[0];

        // Image url
        var str = "" + pokemon["Pokedex Number"]
        var pad = "000"
        var pokedex_num = pad.substring(0, pad.length - str.length) + str;
        if (form == "") { var image_name = pokedex_num + '.png'; }
        else if (isshiny) { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '-Shiny.png'; }
        else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
        var image_url = './assets/images/' + image_name;

        pokemon.imageurl = image_url;
        pokemon.imagename = image_name;
        pokemon.Shiny = isshiny;
        pokemon.PokemonId = pokemon["Pokemon Id"];
        return pokemon;
    }
}

function imagefromid(pokemonid, pokemons) {
    var pokemon = pokemons.filter(it => it["Pokemon Id"] === pokemonid);
    pokemon = pokemon[0];
    var str = "" + pokemon["Pokedex Number"]
    var pad = "000"
    var pokedex_num = pad.substring(0, pad.length - str.length) + str;
    if (pokemon["Alternate Form Name"] == "NULL") { var image_name = pokedex_num + '.png'; }
    else { var image_name = pokedex_num + '-' + pokemon["Alternate Form Name"].replace(" ", "-") + '.png'; }
    var image_url = './assets/images/' + image_name;
    return image_url;
}

module.exports = { getallpokemon, insertpokemon, deletepokemon, pokemondata, imagefromid };