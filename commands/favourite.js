const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

// Initialize the variable.
var pokemons_from_database = null;
var static_user_pokemons = null;

module.exports.run = async (bot, message, args, prefix, user_available, pokemons, cmd) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    page = 1;
    //Get user data.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
            static_user_pokemons = pokemons_from_database;
            var user_pokemons = pokemons_from_database;
            var order_type = user.OrderType;

            // Ordering Pokemons based on user.
            if (order_type == "Level") { user_pokemons = _.orderBy(user_pokemons, ['Level'], ['asc']); }
            else if (order_type == "IV") {
                for (i = 0; i < user_pokemons.length; i++) {
                    user_pokemons[i]["Total_IV"] = parseFloat(total_iv(user_pokemons[i].IV));
                }
                user_pokemons = _.orderBy(user_pokemons, ['Total_IV'], ['desc']);
            }
            else if (order_type == "Number") { user_pokemons = user_pokemons; }
            else if (order_type == "Alphabet") {
                for (i = 0; i < user_pokemons.length; i++) {
                    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == user_pokemons[i].PokemonId)[0];
                    var temp_name = "";
                    if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
                    else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
                    else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
                    else { temp_name = pokemon_db["Pokemon Name"]; }
                    var pokemon_name = temp_name;
                    user_pokemons[i]["Name"] = pokemon_name;
                }
                user_pokemons = _.orderBy(user_pokemons, ['Name'], ['asc']);
            }

            // For only fav command.
            if (args.length == 0 || isInt(args[0])) {
                user_pokemons = user_pokemons.filter(pokemon => pokemon.Favourite == true);
                return create_pagination(message, pokemons, user_pokemons);
            }
            else {
                return message.channel.send(`Invalid command! Use ${prefix}fav to see all favourite pokemons!`);
            }
        });
    });
}

// Function for pagination.
function create_pagination(message, pokemons, user_pokemons) {

    if (user_pokemons.length == 0) { message.channel.send("Pokemons not found."); return; }

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
            var pokemon_number = static_user_pokemons.findIndex(x => x === chunked_pokemons[a][i]);
            if (chunked_pokemons[a][i].Nickname != undefined) {
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
        embed.setFooter(`Page ${a + 1}/${chunked_pokemons.length}. You have ${user_pokemons.length} Pokemon.`);
        global_embed.push(embed);
    }

    page = page - 1;
    if (page > global_embed.length - 1 || page < 0) { return message.channel.send('No page found.') }

     // Send message to channel.
     message.channel.send(global_embed[page]).then(msg => {
        if (global_embed.length == 1) return;
        pagination.createpage(message.channel.id, message.author.id, msg.id, global_embed, page);
    });
}

// Calculate total iv from iv array.
function total_iv(iv) {
    var total_iv = ((iv[0] + iv[1] + iv[2] + iv[3] + iv[4] + iv[5]) / 186 * 100).toFixed(2);
    return total_iv;
}

// Check if any value has repeated number of times.
function has_repeated(array, times, number) {
    const counts = {};
    var array_counts = [];
    array.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    for (i = 0; i < Object.keys(counts).length; i++) {
        if (Object.keys(counts)[i] === number && counts[Object.keys(counts)[i]] == times) {
            array_counts.push(Object.keys(counts)[i]);
        }
    }
    if (array_counts.length > 0) { return true; }
    else { return false; }
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

// Check if given value is float.
function isFloat(x) { return !!(x % 1); }

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "favourite",
    aliases: []
}