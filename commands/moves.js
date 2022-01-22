const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const user_model = require('../models/user.js'); // To get user model.
const _ = require('lodash'); // For utils

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());
const moves_details = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length > 0) {
        // Forms
        var isshiny = false;
        var form = [];
        if (args[0].toLowerCase() == "shiny") { form.push("Shiny"); args.splice(0, 1); if (args[0] == undefined) { message.channel.send("That is not a valid pokemon!"); return; } }
        if (args[0].toLowerCase() == "alolan") { form.push("Alola"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "galarian") { form.push("Galar"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "gigantamax") { form.push("Gigantamax"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "eternamax") { form.push("Eternamax"); args.splice(0, 1) }
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
        else if (isshiny) { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '-Shiny.png'; isshiny = false; }
        else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
        var image_url = './assets/images/' + image_name;

        var selected_pokemon = {};
        selected_pokemon.PokemonId = pokemon["Pokemon Id"];
        selected_pokemon.Shiny = isshiny;
        selected_pokemon.Level = 100;
        selected_pokemon.imageurl = image_url;
        selected_pokemon.imagename = image_name;
        pokemon_embed(selected_pokemon)
    }
    else if (args.length == 0) {
        //Get user data.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) console.log(err);
            getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var pokemon_moves = selected_pokemon.Move;

                if (pokemon_moves == undefined) { var embed_current_moves = ["Move 1: None", "Move 2: None", "Move 3: None", "Move 4: None"]; }
                else {
                    var embed_current_moves = []
                    if (embed_current_moves[0] == undefined || embed_current_moves[0] == null) embed_current_moves[0] = "Move 1: None";
                    else embed_current_moves[0] = "Move 1: " + moves_details.find(it => it.num == pokemon_move[0])[0]["name"];
                    if (embed_current_moves[1] == undefined || embed_current_moves[1] == null) embed_current_moves[1] = "Move 2: None";
                    else embed_current_moves[1] = "Move 2: " + moves_details.find(it => it.num == pokemon_move[1])[0]["name"];
                    if (embed_current_moves[2] == undefined || embed_current_moves[2] == null) embed_current_moves[2] = "Move 3: None";
                    else embed_current_moves[2] = "Move 3: " + moves_details.find(it => it.num == pokemon_move[2])[0]["name"];
                    if (embed_current_moves[3] == undefined || embed_current_moves[3] == null) embed_current_moves[3] = "Move 4: None";
                    else embed_current_moves[3] = "Move 4: " + moves_details.find(it => it.num == pokemon_move[3])[0]["name"];
                }
                pokemon_embed(selected_pokemon, embed_current_moves)
            });
        });
    }

    function pokemon_embed(selected_pokemon, embed_current_moves) {

        //Get pokemon name.
        var pokemon_moveset = get_pokemon_move(selected_pokemon.PokemonId, pokemons);
        pokemon_moveset = pokemon_moveset.filter(it => it[0] <= selected_pokemon.Level);

        // Show Embedded Message.
        var embed = new Discord.MessageEmbed()
        embed.setColor(message.member.displayHexColor)
        embed.setTitle(title)
        if (embed_current_moves != undefined) {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: Level ${selected_pokemon.Level} ${get_pokemon_full_name(selected_pokemon, pokemons)}`; }
            else { title = `Level ${selected_pokemon.Level} ${get_pokemon_full_name(selected_pokemon, pokemons)}`; }
            embed.setTitle(title)
            embed.setDescription(`To learn a move, do ${prefix}learn <move>`);
            embed.addField("Current Moves", embed_current_moves.join("\n"));
            var available_moves = "";
            for (var i = 0; i < pokemon_moveset.length; i++) {
                available_moves += `${pokemon_moveset[i][1]}\n`;
            }
            embed.addField("Available Moves", available_moves);
            embed.setFooter(`You have ${pokemon_moveset.length} moves to learn and use in battle!`);
        }
        else {
            var title = "";
            if (selected_pokemon.Shiny) { title = `:star: ${get_pokemon_full_name(selected_pokemon, pokemons)}'s moves`; }
            else { title = `${get_pokemon_full_name(selected_pokemon, pokemons)}'s moves`; }
            var description = "";
            for (var i = 0; i < pokemon_moveset.length; i++) {
                description += `${pokemon_moveset[i][1].replace(":lock:", "")} | Level: ${pokemon_moveset[i][0]} \n`
            }
            if (selected_pokemon.imageurl) { embed.attachFiles(image_url); embed.setThumbnail('attachment://' + selected_pokemon.imagename); }
            embed.setTitle(title);
            embed.setDescription(description);
        }
        message.channel.send(embed);

    }
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
        moveset = movesparser.formmoves(learnset);
    }
    else if (pokemon_db["Alternate Form Name"] == "Galar") {
        temp_name = pokemon_db["Pokemon Name"] + "galar";
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset);
    }
    else {
        temp_name = pokemon_db["Pokemon Name"];
        var pokemon_moves = moves.filter(it => it["pokemon"] == temp_name.toLowerCase())[0];
        var learnset = pokemon_moves.learnset;
        moveset = movesparser.formmoves(learnset);
    }
    return moveset;
}

module.exports.config = {
    name: "moves",
    aliases: []
}