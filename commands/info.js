const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');
const floor = require('lodash/floor');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (message.isadmin) { if (message.mentions.users.first()) { message.author = message.mentions.users.first(); args.shift() } } // Admin check

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
            var user_pokemons = pokemons_from_database;

            // If no arguments
            if (args.length == 0) {
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var index = user_pokemons.indexOf(selected_pokemon) + 1;
            }

            // If arguments is latest or l
            else if (args[0].toLowerCase() == "l" || args[0].toLowerCase() == "latest") {
                var selected_pokemon = user_pokemons[user_pokemons.length - 1];
                var index = user_pokemons.length;
            }

            // If arguements is s or selected
            else if (args[0].toLowerCase() == "s" || args[0].toLowerCase() == "selected") {
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var index = user_pokemons.indexOf(selected_pokemon) + 1;
            }

            // If arguments is number
            else if (isInt(args[0])) {
                if (typeof user_pokemons[args[0] - 1] != 'undefined') {
                    var selected_pokemon = user_pokemons[args[0] - 1];
                    var index = args[0];
                }
                else {
                    message.channel.send("No pokemon exists with that number.");
                    return;
                }
            }

            else return message.channel.send("Invalid argument.");

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

            //Embed message material.
            if (selected_pokemon.Nickname) { var name = `'${selected_pokemon.Nickname}'` }
            else { var name = pokemon_name }
            let exp = selected_pokemon.Experience;
            let level = selected_pokemon.Level;
            let hp_iv = selected_pokemon.IV[0];
            let atk_iv = selected_pokemon.IV[1];
            let def_iv = selected_pokemon.IV[2];
            let spa_iv = selected_pokemon.IV[3];
            let spd_iv = selected_pokemon.IV[4];
            let spe_iv = selected_pokemon.IV[5];
            let nature = selected_pokemon.Nature;
            let shiny = selected_pokemon.Shiny;
            let ev = 0;

            if (shiny) { var title = `:star: Level ${level} ${name}`; }
            else { var title = `Level ${level} ${name}`; }

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
            var image_url = './assets/images/' + image_name;

            //Embed message.
            const embed = new Discord.MessageEmbed();
            embed.attachFiles(image_url)
            embed.setTitle(title);
            embed.setDescription(description +
                `\n**Type**: ${type}` +
                `\n**Nature**: ${nature_name}` +
                `\n**HP**: ${hp} - IV ${hp_iv}/31` +
                `\n**Attack**: ${atk} - IV ${atk_iv}/31` +
                `\n**Defense**: ${def} - IV ${def_iv}/31` +
                `\n**Sp. Atk**: ${spa} - IV ${spa_iv}/31` +
                `\n**Sp. Def**: ${spd} - IV ${spd_iv}/31` +
                `\n**Speed**: ${spe} - IV ${spe_iv}/31` +
                `\n**Total IV**: ${total_iv}%`);
            embed.setColor(message.member.displayHexColor);
            embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            embed.setImage('attachment://' + image_name)
            embed.setFooter(`Displaying Pokémon: ${index}/${user_pokemons.length}`);
            message.channel.send(embed)
        });
    });
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
    name: "info",
    aliases: []
}