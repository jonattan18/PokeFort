const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs'); // To read json file.
const { title } = require('process');
const user_model = require('../models/user.js'); // To get user model.

// To get pokemon moves data.
const moves = JSON.parse(fs.readFileSync('./assets/moves.json').toString());
const moves_details = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;
        var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
        var _id = selected_pokemon._id;
        var index = user_pokemons.indexOf(selected_pokemon);
        var pokemon_level = selected_pokemon.Level;
        var pokemon_move = selected_pokemon.Move;

        if (pokemon_moves == undefined) { var embed_current_moves = ["Move 1: None", "Move 2: None", "Move 3: None", "Move 4: None"]; }
        else {
            var embed_current_moves = []
            if(embed_current_moves[0] == undefined ||embed_current_moves[0] == null)  embed_current_moves[0] = "Move 1: None";
            else embed_current_moves[0] = "Move 1: " + moves_details.find(it => it.num == pokemon_move[0])[0]["name"];
            if(embed_current_moves[1] == undefined ||embed_current_moves[1] == null)  embed_current_moves[1] = "Move 2: None";
            else embed_current_moves[1] = "Move 2: " + moves_details.find(it => it.num == pokemon_move[1])[0]["name"];
            if(embed_current_moves[2] == undefined ||embed_current_moves[2] == null)  embed_current_moves[2] = "Move 3: None";
            else embed_current_moves[2] = "Move 3: " + moves_details.find(it => it.num == pokemon_move[2])[0]["name"];
            if(embed_current_moves[3] == undefined || embed_current_moves[3] == null)  embed_current_moves[3] = "Move 4: None";
            else embed_current_moves[3] = "Move 4: " + moves_details.find(it => it.num == pokemon_move[3])[0]["name"];
        }

        //Get pokemon name.
        var pokemon_name = get_pokemon_name(selected_pokemon.PokemonId, pokemons).toLowerCase();
        var pokemon_moves = moves.filter(it => it["pokemon"] == pokemon_name)[0];
        var learnset = pokemon_moves.learnset;

        //Get pokemon moves.
        var total_moves_list = [];
        var valid_moves_list = [];
        for (var i = 0; i < Object.keys(learnset).length; i++) {
            var level_based = learnset[Object.keys(learnset)[i]].filter(Number);
            if (level_based.length == 0) { continue; }
            total_moves_list.push(level_based);
            if (level_based.some(it => it <= pokemon_level)) {
                var name = moves_details[Object.keys(learnset)[i]]["name"];
                valid_moves_list.push(name);
            }
        }

        var title = get_pokemon_full_name(selected_pokemon, pokemons);

        // Show Embedded Message.
        var embed = new Discord.MessageEmbed()
        embed.setColor(message.member.displayHexColor)
        embed.setTitle(title)
        embed.setDescription(`To learn a move, do ${prefix}learn <move>`);
        embed.addField("Current Moves", embed_current_moves.join("\n"));
        embed.addField("Available Moves", valid_moves_list.join("\n"));
        embed.setFooter(`You have ${valid_moves_list.length} moves to learn and use in battle!`);
        message.channel.send(embed);
    });
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

    if (selected_pokemon.Shiny) { var title = `:star: Level ${selected_pokemon.Level} ${name}`; }
    else { var title = `Level ${selected_pokemon.Level} ${name}`; }

    return title;
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(pokemon_id, pokemons) {
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
    var temp_name = "";
    if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = pokemon_db["Pokemon Name"] + "alola"; }
    else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = pokemon_db["Pokemon Name"] + "galar"; }
    else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
    else { temp_name = pokemon_db["Pokemon Name"]; }
    var pokemon_name = temp_name;
    return pokemon_name;
}

module.exports.config = {
    name: "moves",
    aliases: []
}