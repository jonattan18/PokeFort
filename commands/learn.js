const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

     //Get user data.
     user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var current_move = "";

        var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
        var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

        //Get Pokemon Name from Pokemon ID.
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

        var embed = new Discord.MessageEmbed();
        embed.setTitle(`${pokemon_name}'s moves`);
        embed.setDescription(`Select the move you want to replace with ${current_move}`);
        
     });
}

module.exports.config = {
    name: "learn",
    aliases: []
}