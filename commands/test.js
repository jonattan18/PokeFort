const Discord = require('discord.js'); // For Embedded Message.
const fs = require('fs');
const user_model = require('../models/user');
const pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());

module.exports.run = async (bot, message, args) => {

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