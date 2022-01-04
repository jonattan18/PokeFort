const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');

module.exports.run = async (bot, message, args) => {
    var pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());
    const new_pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());
    
}

module.exports.config = {
    name: "test",
    aliases: []
}