const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;
        var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
        var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

        //Embed message material.
        let name = selected_pokemon.Nickname;
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

        let title = `Level ${level} ${name}`;
        let description = `${exp}/${exp_to_level(level)}`;
        var type = "";
        if (pokemon_db["Secondary Type"] != "NULL") { type = pokemon_db["Primary Type"] + " | " + pokemon_db["Secondary Type"] }
        else { type = pokemon_db["Primary Type"]; }
        let nature_name = selected_pokemon.Nature;
        let total_iv = (hp + atk + def + spa + spd + spe / 186 * 100).toFixed(2);

    });
}

// Function to get the nature from number.
function nature_of(int) {
    if (1) { return ["Adament", 0, 10, 0, -10, 0, 0] }
    if (2) { return ["Bashful", 0, 0, 0, 0, 0, 0] }
    if (3) { return ["Bold", 0, -10, 10, 0, 0, 0] }
    if (4) { return "Brave" }
    if (5) { return "Calm" }
    if (6) { return "Careful" }
    if (7) { return ["Docile", 0, 0, 0, 0, 0, 0] }
    if (8) { return "Gentle" }
    if (9) { return ["Hardy", 0, 0, 0, 0, 0, 0] }
    if (10) { return "Hasty" }
    if (11) { return "Impish" }
    if (12) { return "Jolly" }
    if (13) { return "Lax" }
    if (14) { return "Lonely" }
    if (15) { return "Mild" }
    if (16) { return "Modest" }
    if (17) { return "Naive" }
    if (18) { return "Naughty" }
    if (19) { return "Quiet" }
    if (20) { return "Quirky" }
    if (21) { return "Rash" }
    if (22) { return "Relaxed" }
    if (23) { return "Sassy" }
    if (24) { return "Serious" }
    if (25) { return "Timid" }
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
}


module.exports.config = {
    name: "info",
    aliases: []
}