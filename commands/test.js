const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');

module.exports.run = async (bot, message, args) => {
   /*
    var pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());
    const new_pokemons = JSON.parse(fs.readFileSync('./assets/new_pokemons.json').toString());

    for (i = 0; i < pokemons.length; i++) {
        var id = pokemons[i]["Pokedex Number"];
        console.log(id);
        var jp_namu = new_pokemons.filter(x => x.ID === id)[0].Jp_namu;
        var jp_name = new_pokemons.filter(x => x.ID === id)[0].Jp_name;
        var jp_name2 = new_pokemons.filter(x => x.ID === id)[0].Jp_name2;
        if (jp_name !== jp_name2) {
            var jp_name_final = [jp_namu, jp_name, jp_name2];
        }
        else var jp_name_final = [jp_namu, jp_name];
        pokemons[i]["jp_name"] = jp_name_final;

    }

    fs.writeFileSync('./assets/pokemons_jp.json', JSON.stringify(pokemons));
    */
}

module.exports.config = {
    name: "test",
    aliases: []
}