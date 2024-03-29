// Imports
const Discord = require('discord.js');

// Models
const channel_model = require('../../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    // Pokemon Level
    let level = getRandomInt(1, 36);

    try {
        if (args[args.length - 2].toLowerCase() == "-l") { level = args[args.length - 1]; args.splice(args.length - 2, 2); }
    } catch (e) { }

    // Forms
    var isshiny = false;
    var form = [];
    if (args[0].toLowerCase() == "shiny") { form.push("Shiny"); args.splice(0, 1); if (args[0] == undefined) { message.channel.send("That is not a valid pokemon!"); return; } }
    if (args[0].toLowerCase() == "alolan") { form.push("Alola"); args.splice(0, 1) }
    else if (args[0].toLowerCase() == "galarian") { form.push("Galar"); args.splice(0, 1) }
    else if (args[0].toLowerCase() == "gigantamax" || args[0].toLowerCase() == "gmax") { form.push("Gigantamax"); args.splice(0, 1) }
    else if (args[0].toLowerCase() == "eternamax") { form.push("Eternamax"); args.splice(0, 1) }
    else if (args[0].toLowerCase() == "mega" && args[args.length - 1].toLowerCase() == "x" || args[args.length - 1].toLowerCase() == "y") {
        if (args[args.length - 1] == "x") { form.push("Mega X") };
        if (args[args.length - 1] == "y") { form.push("Mega Y") };
        args.splice(0, 1);
        args.splice(args.length - 1, 1)
    }
    else if (args[0].toLowerCase() == "mega") { form.push("Mega"); args.splice(0, 1) }
    else if (args[0].toLowerCase() == "hisuian") { form.push("Hisuian"); args.splice(0, 1) }

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

    if (form == "Shiny" || isshiny == true) {
        spawn_pokemon(message, prefix, pokemon, level, true);
    }
    else {
        spawn_pokemon(message, prefix, pokemon, level, false);
    }
}

// Pokemon Spawn System
function spawn_pokemon(message, prefix, spawn_pokemon, pokemon_level, pokemon_shiny) {

    // Image url
    var str = "" + spawn_pokemon["Pokedex Number"];
    var form = spawn_pokemon["Alternate Form Name"];
    var pad = "000"
    var pokedex_num = pad.substring(0, pad.length - str.length) + str;
    if (form == "" || form == "NULL") { var image_name = pokedex_num + '.png'; }
    else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
    var image_url = './assets/images/' + image_name;
    var msg_id = "";

    // Create embed message
    let embed = new Discord.MessageEmbed();
    embed.attachFiles(image_url)
    embed.setImage('attachment://' + image_name)
    embed.setTitle("A wild pokémon has appeared!")
    embed.setDescription(`Guess the pokémon and type ${prefix}catch <pokémon> to catch it!`)
    embed.setColor("#1cb99a");
    message.channel.send({ embeds: [embed] }).then(msg => {
        msg_id = msg.id;

        // Pokemon Nature
        let random_nature = getRandomInt(1, 26);

        // IV creation
        var IV = [];
        while (true) {
            let hp_iv = getRandomInt(0, 32);
            let atk_iv = getRandomInt(0, 32);
            let def_iv = getRandomInt(0, 32);
            let spa_iv = getRandomInt(0, 32);
            let spd_iv = getRandomInt(0, 32);
            let spe_iv = getRandomInt(0, 32);
            let total_iv = (hp_iv + atk_iv + def_iv + spa_iv + spd_iv + spe_iv / 186 * 100).toFixed(2);
            IV = [hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv];
            if (total_iv > 90 || total_iv < 10) { if (getRandomInt(0, 1000) > 990) { continue; } else { break; } }
            break;
        }

        // Updating pokemon to database.
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { PokemonID: spawn_pokemon["Pokemon Id"], PokemonLevel: pokemon_level, Shiny: pokemon_shiny, Hint: 0, PokemonNature: random_nature, PokemonIV: IV, SpawnLimit: 30, MessageCount: 0, MessageID: msg_id }, function (err, user) {
            if (err) { console.log(err) }
        });
    });
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "spawn",
    aliases: []
}