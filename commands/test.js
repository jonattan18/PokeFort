const fs = require('fs'); // To read files.

// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

module.exports.run = async (bot, message, args) => {

}


module.exports.config = {
    name: "test",
    aliases: []
}