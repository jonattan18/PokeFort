const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

// Initialize the variable.
var pokemons_from_database = null;
var static_user_pokemons = null;

module.exports.run = async (bot, interaction, user_available, pokemons, cmd) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
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
                    user_pokemons[i]["Name"] = getPokemons.get_pokemon_name_from_id(user_pokemons[i].PokemonId, pokemons, false);
                }
                user_pokemons = _.orderBy(user_pokemons, ['Name'], ['asc']);
            }

            // For only fav command.
            user_pokemons = user_pokemons.filter(pokemon => pokemon.Favourite == true);
            return create_pagination(interaction, pokemons, user_pokemons);
        });
    });
}

// Function for pagination.
function create_pagination(interaction, pokemons, user_pokemons, page = 1) {

    if (user_pokemons.length == 0) return interaction.reply({ content: "Pokemons not found.", ephemeral: true });

    var chunked_pokemons = chunkArray(user_pokemons, 20);
    var global_embed = [];
    for (a = 0; a < chunked_pokemons.length; a++) {
        if (chunked_pokemons[a] == undefined) break;

        var description = "";
        for (i = 0; i < chunked_pokemons[a].length; i++) {

            //Get Pokemon Name from Pokemon ID.
            var pokemon_name = getPokemons.get_pokemon_name_from_id(chunked_pokemons[a][i].PokemonId, pokemons, chunked_pokemons[a][i].Shiny, true);

            var total_iv = ((chunked_pokemons[a][i].IV[0] + chunked_pokemons[a][i].IV[1] + chunked_pokemons[a][i].IV[2] + chunked_pokemons[a][i].IV[3] + chunked_pokemons[a][i].IV[4] + chunked_pokemons[a][i].IV[5]) / 186 * 100).toFixed(2);
            var pokemon_number = static_user_pokemons.findIndex(x => x === chunked_pokemons[a][i]);
            if (chunked_pokemons[a][i].Nickname != undefined) {
                description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}% | Nickname: ${chunked_pokemons[a][i].Nickname}\n`;
            }
            else { description += `**${pokemon_name}** | Level: ${chunked_pokemons[a][i].Level} | Number: ${pokemon_number + 1} | IV: ${total_iv}%\n`; }
        }

        // Create embed message
        var username = interaction.user.username;
        let embed = new Discord.EmbedBuilder();
        embed.setTitle(`**${username}'s Pokémon:**`)
        embed.setColor(interaction.member.displayHexColor)
        embed.setDescription(description);
        embed.setFooter({ text: `Page ${a + 1}/${chunked_pokemons.length}. You have ${user_pokemons.length} Pokemon.` });
        global_embed.push(embed);
    }

    page = page - 1;
    if (page > global_embed.length - 1 || page < 0) return interaction.reply({ content: 'No page found.', ephemeral: true });

    // Send message to channel.
    interaction.reply({ embeds: [global_embed[page]], fetchReply: true }).then(msg => {
        if (global_embed.length == 1) return;
        pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, global_embed, page);
    });
}

// Calculate total iv from iv array.
function total_iv(iv) {
    var total_iv = ((iv[0] + iv[1] + iv[2] + iv[3] + iv[4] + iv[5]) / 186 * 100).toFixed(2);
    return total_iv;
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
    name: "favourite",
    description: "Show favourite pokemon.",
    aliases: []
}