const fs = require('fs'); // To read files.
const Sim = require('pokemon-showdown');
const Discord = require('discord.js'); // For Embedded Message.


// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

module.exports.run = async (bot, message, args) => {

}


module.exports.config = {
    name: "test",
    aliases: []
}