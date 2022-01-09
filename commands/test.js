const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');

module.exports.run = async (bot, message, args) => {

   /* 
    var pokemons = JSON.parse(fs.readFileSync('./assets/append.json').toString());
    var pokemons2 = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());
    for (i = 0; i < Object.keys(pokemons2).length; i++) {
        console.log(i)
        var move_id = pokemons2[Object.keys(pokemons2)[i]].num;
        var move_desc = pokemons.filter(x => x.move_id == move_id && x.language_id == 9);
        try { var wanted_desc = move_desc[move_desc.length - 1].flavor_text; } catch(e) { var wanted_desc = null; }
        pokemons2[Object.keys(pokemons2)[i]].desc = wanted_desc;
    }

    fs.writeFileSync('./assets/pokemons_jp.json', JSON.stringify(pokemons2));
 */
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

module.exports.config = {
    name: "test",
    aliases: []
}