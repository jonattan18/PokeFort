const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var user_pokemons = user.Pokemons;
        var chunked_pokemons = chunkArray(user_pokemons, 20);
        var global_embed = [];
        for (a = 0; a < chunked_pokemons.length; a++) {
            if (chunked_pokemons[a] == undefined) break;

            var description = "";
            for (i = 0; i < chunked_pokemons[a].length; i++) {

                //Get Pokemon Name from Pokemon ID.
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == chunked_pokemons[a][i].PokemonId)[0];
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
                if (chunked_pokemons[a][i].Shiny) { pokemon_name += ' :star:' }

                var total_iv = ((chunked_pokemons[a][i].IV[0] + chunked_pokemons[a][i].IV[1] + chunked_pokemons[a][i].IV[2] + chunked_pokemons[a][i].IV[3] + chunked_pokemons[a][i].IV[4] + chunked_pokemons[a][i].IV[5]) / 186 * 100).toFixed(2);
                var pokemon_number = user_pokemons.findIndex(x => x === chunked_pokemons[a][i]);
                if (chunked_pokemons[a][i].Nickname != "") {
                    description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}% | Nickname: ${chunked_pokemons[a][i].Nickname}\n`;
                }
                else { description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}%\n`; }
            }

            // Create embed message
            var username = message.author.username;
            let embed = new Discord.MessageEmbed();
            embed.setTitle(`**${username}'s Pokémon:**`)
            embed.setColor(message.member.displayHexColor)
            embed.setDescription(description);

            global_embed.push(embed);
        }

        message.channel.send(global_embed[0]);
    });

}


// Chunk array into equal parts.
function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}

module.exports.config = {
    name: "pokemon",
    aliases: []
}