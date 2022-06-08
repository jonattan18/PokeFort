// Load Model Data.
const pokemons_model = require('../models/pokemons');

// Load Config Data.
const config = require('../config/config.json');
const forms = require('../config/forms.json');

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

// Function to get pokemon data from user typed arguement.
function getPokemonData(args, pokemons, shiny_allowed) {

    // Lowercase shift.
    args = args.map(it => it.toLowerCase());

    // Shiny check
    if (shiny_allowed) {
        var shiny = false;
        if (args[0] == "shiny") { shiny = true; args.splice(0, 1); }
    }

    // Form Check
    var form = "NULL";
    var search_type = null;

    // Front Form Check
    if (forms.allowed_forms.includes(args[0] + " " + args[1])) { form = args[0].capitalize() + " " + args[1].capitalize(); args.splice(0, 2); search_type = "Front"; }
    else if (forms.allowed_forms.includes(args[0])) { form = args[0].capitalize(); args.splice(0, 1); search_type = "Front"; }

    // Back Form Check
    if (forms.allowed_forms.includes(args[args.length - 1])) { form = args[args.length - 1].capitalize(); args.splice(args.length - 1, 1); search_type = "Back"; }
    else if (forms.allowed_forms.includes(args[args.length - 2] + " " + args[args.length - 1])) { form = args[args.length - 2].capitalize() + " " + args[args.length - 1].capitalize(); args.splice(args.length - 2, 2); search_type = "Back"; }

    // Exectional Form Change
    if (form == "Mega" && (args[args.length - 1] == "x" || args[args.length - 1] == "y")) {
        form += ` ${args[args.length - 1].toUpperCase()}`;
        args.splice(args.length - 1, 1);
    }

    if (form == "Alolan") form = "Alola";
    if (form == "Galarian") form = "Galar";
    if (form == "Gmax") form = "Gigantamax";

    // Pokemon Name Check
    var user_pokemon_name = args.join(" ")._normalize();
    var pokemon = pokemons.filter(it => (it["Pokemon Name"]._normalize() == user_pokemon_name) && (it["Alternate Form Name"] == form));
    if (pokemon.length == 0) pokemon = pokemons.filter(it => (it["jp_name"].some(x => x._normalize() == user_pokemon_name)) && (it["Alternate Form Name"] == form));
    if (pokemon.length == 0) pokemon = pokemons.filter(it => (it["dr_name"]._normalize() == user_pokemon_name) && (it["Alternate Form Name"] == form));
    if (pokemon.length == 0) pokemon = pokemons.filter(it => (it["fr_name"]._normalize() == user_pokemon_name) && (it["Alternate Form Name"] == form));
    if (pokemon.length == 0) return null;
    else pokemon = pokemon[0];

    if (form != "NULL" && pokemon["Dex Search"] != undefined && pokemon["Dex Search"] != search_type) return null;

    // Image Finding
    if (form != "NULL") form = `-${form.replace(/ /g, "-")}`;
    else form = "";
    var image_name = pokemon["Pokedex Number"].pad(3) + form.replace("%", "");
    if (shiny) image_name += "-Shiny.png";
    else image_name += ".png";
    var image_url = './assets/images/' + image_name.replace("%", "");

    // Pokemon Name
    var pokemon_name = get_pokemon_name_from_id(pokemon["Pokemon Id"], pokemons, shiny);
    pokemon.fullname = pokemon_name;
    pokemon.name_no_shiny = get_pokemon_name_from_id(pokemon["Pokemon Id"], pokemons, false);
    pokemon.imageurl = image_url;
    pokemon.imagename = image_name;
    pokemon.pokemon_name = pokemon_name;
    pokemon.Shiny = shiny;
    pokemon["PokemonId"] = pokemon["Pokemon Id"]

    return pokemon;
}

// Function to get image from given pokemon id.
function imagefromid(pokemonid, pokemons, shiny) {
    var pokemon = pokemons.filter(it => it["Pokemon Id"] === pokemonid);
    pokemon = pokemon[0];
    var str = "" + pokemon["Pokedex Number"]
    var pad = "000"
    var pokedex_num = pad.substring(0, pad.length - str.length) + str;
    if (pokemon["Alternate Form Name"] == "NULL") { var image_name = pokedex_num }
    else { var image_name = pokedex_num + '-' + pokemon["Alternate Form Name"].replace(" ", "-") }
    if (shiny) var image_url = './assets/images/' + image_name + '-Shiny.png';
    else var image_url = './assets/images/' + image_name + '.png';
    return image_url.replace("%", "");
}

// Get pokemon name from pokemon ID.
function get_pokemon_name_from_id(pokemonID, pokemons, shiny, star_shiny = false) {

    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemonID)[0];

    //Get Pokemon Name from Pokemon ID.
    if (pokemon_db["Alternate Form Name"] == "Mega X" || pokemon_db["Alternate Form Name"] == "Mega Y") {
        var pokemon_name = `Mega ${pokemon_db["Pokemon Name"]} ${pokemon_db["Alternate Form Name"][pokemon_db["Alternate Form Name"].length - 1]}`
    }
    else {
        var temp_name = "";
        if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
        else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
        else if (pokemon_db["Alternate Form Name"] != "NULL") {
            if (pokemon_db["Dex Search"] == "Front") temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"];
            else if (pokemon_db["Dex Search"] == "Back") temp_name = pokemon_db["Pokemon Name"] + " " + pokemon_db["Alternate Form Name"];
            else temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"];
        }
        else { temp_name = pokemon_db["Pokemon Name"]; }
        var pokemon_name = temp_name;
    }

    if (shiny) {
        if (star_shiny) var name = "⭐ " + pokemon_name;
        else var name = "Shiny " + pokemon_name;
    }
    else var name = pokemon_name;
    return name;
}

Object.defineProperty(String.prototype, 'capitalize', {
    value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    enumerable: false
});

Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

module.exports = { getallpokemon, insertpokemon, deletepokemon, getPokemonData, get_pokemon_name_from_id, imagefromid };