const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');
const user_model = require('../models/user');
const pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());

module.exports.run = async (bot, message, args) => {

    /*
    var no_of_loops = 10000;
    var mons = {};
    mons.Pokemons = [];

    for (i = 0; i < no_of_loops; i++) {

        var random_number = getRandomInt(1, 807);
        var nature = getRandomInt(1, 25);
        var level = getRandomInt(1, 100);
        var Experience = getRandomInt(1, 100);
        let pokemon = pokemons[random_number];

        var IV = [];

        let hp_iv = getRandomInt(0, 32);
        let atk_iv = getRandomInt(0, 32);
        let def_iv = getRandomInt(0, 32);
        let spa_iv = getRandomInt(0, 32);
        let spd_iv = getRandomInt(0, 32);
        let spe_iv = getRandomInt(0, 32);
        IV = [hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv];

        mons.Pokemons.push({
            PokemonId: pokemon["Pokemon Id"],
            Nickname: '',
            CatchedOn: Date.now(),
            Experience: Experience,
            Level: level,
            Nature: nature,
            IV: IV,
            Shiny: false,
            Reason: "Catched",
        });
    }

    fs.writeFileSync('./assets/mons.json', JSON.stringify(mons));
 */
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "test",
    aliases: []
}