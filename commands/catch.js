const Discord = require('discord.js'); // For Embedded Message.

// Models
const channel_model = require('../models/channel');
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (user_available === false) { message.channel.send(`You should use ${prefix}start to use this command!`); return; }
    if (args.length == 0) { message.channel.send("You have not mentioned any pokemon name. Use ``" + prefix + "catch <pokemon>`` to catch."); return; }

    var form = "";
    if (args[0].toLowerCase() == "alolan") { form = "Alola"; args.splice(0, 1) }
    else if (args[0].toLowerCase() == "galarian") { form = "Galar"; args.splice(0, 1) }
    else { form = "NULL"; }

    let given_name = args.join(" ")._normalize();

    var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in English Name.
    if (pokemon.length == 0) {
        dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in Germany Name.
        jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name) && it["Alternate Form Name"] === form); // Searching in Japanese Name.
        fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in French Name.
        if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) { message.channel.send("That is the wrong pokemon!"); return; };
    }

    function language_finder(dr_pokemon, jp_pokemon, fr_pokemon) {
        if (dr_pokemon.length > 0) { pokemon = dr_pokemon; }
        else if (jp_pokemon.length > 0) { pokemon = jp_pokemon; }
        else if (fr_pokemon.length > 0) { pokemon = fr_pokemon; }
        else { return false; }
    }

    pokemon = pokemon[0];

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) console.log(err);
        if (channel) {
            if (channel.PokemonID == 0) { message.channel.send("No pokemon currently seen on wild."); return; }
            if (pokemon["Pokemon Id"] == channel.PokemonID) {
                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                    if (err) console.log(err);
                    if (user) {

                        // Get number of catached pokemons.
                        var user_pokemons = user.Pokemons;
                        var no_of_pokemons = user_pokemons.filter(it => it["PokemonId"] === channel.PokemonID && it["Reason"] === "Catched").length + 1;
                        var splitted_number = no_of_pokemons.toString().split('');
                        var credit_amount = 0;

                        if (no_of_pokemons == 1) { credit_amount = 35; }
                        if (splitted_number.length == 2 && splitted_number[1] == 0) { credit_amount = 350; }
                        if (splitted_number.length == 3 && splitted_number[1] == 0 && splitted_number[2] == 0) { credit_amount = 3500; }
                        if (splitted_number.length == 4 && splitted_number[1] == 0 && splitted_number[2] == 0 && splitted_number[3] == 0) { credit_amount = 35000; }

                        user.Pokemons.push({
                            PokemonId: pokemon["Pokemon Id"],
                            Nickname: pokemon["Pokemon Name"],
                            CatchedOn: Date.now(),
                            Experience: 0,
                            Level: channel.PokemonLevel,
                            Nature: channel.PokemonNature,
                            IV: channel.PokemonIV,
                            Shiny: channel.Shiny,
                            Reason: "Catched",
                        });

                        if (no_of_pokemons == 1) {
                            user.DexRewards.push({
                                PokemonId: pokemon["Pokemon Id"],
                                RewardName: pokemon["Pokemon Name"],
                                RewardAmount: credit_amount,
                                RewardDescription: `${no_of_pokemons} Caught!`
                            });
                        }
                        else {
                            user_model.findOneAndUpdate({ UserID: message.author.id }, { $inc: { "DexRewards.$[el].RewardAmount": credit_amount } }, {
                                arrayFilters: [{ "el.PokemonId": parseInt(pokemon["Pokemon Id"]) }],
                                new: true
                            }, (err, user) => {
                                if (err) return console.log(err);
                            });
                            user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "DexRewards.$[el].RewardDescription": `${no_of_pokemons} Caught!` } }, {
                                arrayFilters: [{ "el.PokemonId": parseInt(pokemon["Pokemon Id"]) }],
                                new: true
                            }, (err, user) => {
                                if (err) return console.log(err);
                            });
                        }
                        user.save();

                        var shiny_pokemon = channel.Shiny ? " Shiny " : " ";

                        var message_string = "";
                        if (no_of_pokemons == 1) { message_string = `Congratulations <@${message.author.id}>. You caught a level ${channel.PokemonLevel}${shiny_pokemon}${pokemon["Pokemon Name"]}! Added to Pokèdex.`; }
                        else if (no_of_pokemons == 10) { message_string = `Congratulations <@${message.author.id}>. You caught a level ${channel.PokemonLevel}${shiny_pokemon}${pokemon["Pokemon Name"]}! This is your 10th ${pokemon["Pokemon Name"]}`; }
                        else if (no_of_pokemons == 100) { message_string = `Congratulations <@${message.author.id}>. You caught a level ${channel.PokemonLevel}${shiny_pokemon}${pokemon["Pokemon Name"]}! This is your 100th ${pokemon["Pokemon Name"]}`; }
                        else if (no_of_pokemons == 1000) { message_string = `Congratulations <@${message.author.id}>. You caught a level ${channel.PokemonLevel}${shiny_pokemon}${pokemon["Pokemon Name"]}! This is your 1000th ${pokemon["Pokemon Name"]}`; }
                        else { message_string = `Congratulations <@${message.author.id}>. You caught a level ${channel.PokemonLevel}${shiny_pokemon}${pokemon["Pokemon Name"]}!`; }
                        message.channel.send(message_string);
                    }
                });

                // Removing pokemon in channel database.
                channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { PokemonID: 0, PokemonLevel: 0, Shiny: false, Hint: 0, MessageCount: 0, SpawnLimit: 0 }, function (err, user) {
                    if (err) { console.log(err) }
                });
            } else { message.channel.send("That is the wrong pokemon!"); return; }
        }
    });

}

// Word search normalizer.
String.prototype._normalize = function () {
    return this.valueOf().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

module.exports.config = {
    name: "catch",
    aliases: []
}