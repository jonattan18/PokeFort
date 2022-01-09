const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');

module.exports.run = async (bot, message, args) => {

    /*
    var pokemons = JSON.parse(fs.readFileSync('./assets/moves.json').toString());

    for (i = 0; i < pokemons.length; i++) {
        var learnset = pokemons[i]["learnset"];
        for (j = 0; j < Object.keys(learnset).length; j++) {
            var new_learnset = pokemons[i]["learnset"][Object.keys(learnset)[j]].filter(onlyUnique);
            pokemons[i]["learnset"][Object.keys(learnset)[j]] = new_learnset;
        }
    }

    fs.writeFileSync('./assets/pokemons_jp.json', JSON.stringify(pokemons));
 */
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

module.exports.config = {
    name: "test",
    aliases: []
}