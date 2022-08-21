// Models
const channel_model = require('../models/channel');
const user_model = require('../models/user');
const leaderboard_model = require('../models/leaderboard');

// Utils
const getPokemons = require('../utils/getPokemon');
const mail = require('../utils/mail');
const getDexes = require('../utils/getDex');
const _ = require('lodash');

// Config file
const config = require("../config/config.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var guess = interaction.options.get("guess").value.split(" ");
    var form = "";
    if (guess[0].toLowerCase() == "alolan") { form = "Alola"; guess.splice(0, 1) }
    else if (guess[0].toLowerCase() == "galarian") { form = "Galar"; guess.splice(0, 1) }
    else if (guess[0].toLowerCase() == "hisuian") { form = "Hisuian"; guess.splice(0, 1) }
    else { form = "NULL"; }

    let given_name = guess.join(" ")._normalize();

    var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in English Name.
    if (pokemon.length == 0) {
        dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in Germany Name.
        jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name) && it["Alternate Form Name"] === form); // Searching in Japanese Name.
        fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in French Name.
        if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) return interaction.reply({ content: "That is the wrong pokemon!" });
    }

    function language_finder(dr_pokemon, jp_pokemon, fr_pokemon) {
        if (dr_pokemon.length > 0) { pokemon = dr_pokemon; }
        else if (jp_pokemon.length > 0) { pokemon = jp_pokemon; }
        else if (fr_pokemon.length > 0) { pokemon = fr_pokemon; }
        else { return false; }
    }

    pokemon = pokemon[0];

    channel_model.findOne({ ChannelID: interaction.channel.id }, (err, channel) => {
        if (err) console.log(err);
        if (channel) {
            if (channel.PokemonID == 0) return interaction.reply({ content: "No pokémon currently seen on wild.", ephemeral: true });
            if (pokemon["Pokemon Id"] == channel.PokemonID) {
                user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                    if (err) console.log(err);

                    // Get number of catached pokemons.
                    getDexes.getalldex(interaction.user.id).then((user_pokemons) => {

                        var no_of_pokemons = user_pokemons.filter(it => it["PokemonId"] == channel.PokemonID).length + 1;
                        var splitted_number = no_of_pokemons.toString().split('');
                        var credit_amount = 0;

                        if (no_of_pokemons == 1) { credit_amount = 35; }
                        if (splitted_number.length == 2 && splitted_number[1] == 0) { credit_amount = 350; }
                        if (splitted_number.length == 3 && splitted_number[1] == 0 && splitted_number[2] == 0) { credit_amount = 3500; }
                        if (splitted_number.length == 4 && splitted_number[1] == 0 && splitted_number[2] == 0 && splitted_number[3] == 0) { credit_amount = 35000; }

                        leaderboard_model.findOne({ Type: "Weekly" }, (err, leaderboard) => {
                            if (err) console.log(err);

                            if (leaderboard) {
                                var current_week_monday = new Date();
                                var days = ((current_week_monday.getDay() + 7) - 1) % 7;
                                current_week_monday.setDate(current_week_monday.getDate() - days);
                                current_week_monday.setHours(0, 0, 0, 0);
                                if (new Date(leaderboard.Timestamp).getTime() < current_week_monday.getTime()) {
                                    if (leaderboard.Users.length > 0) {
                                        var first_winner = leaderboard.Users[0];
                                        var second_winner = leaderboard.Users.length > 1 ? leaderboard.Users[1] : undefined;
                                        var third_winner = leaderboard.Users.length > 2 ? leaderboard.Users[2] : undefined;

                                        // Creation of reward mail attachment for first user.
                                        var first_reward_pokemon_id = config.LEADERBOARD_REWARDS_POKEMON_IDS[Math.floor(Math.random() * config.LEADERBOARD_REWARDS_POKEMON_IDS.length)]
                                        var first_reward_attachment = {
                                            Pokemons: [{
                                                PokemonId: first_reward_pokemon_id,
                                                Experience: 0,
                                                Level: 1,
                                                Nature: Math.floor(Math.random() * 25) + 1,
                                                IV: [
                                                    Math.floor(Math.random() * 11) + 20,
                                                    Math.floor(Math.random() * 11) + 20,
                                                    Math.floor(Math.random() * 11) + 20,
                                                    Math.floor(Math.random() * 11) + 20,
                                                    Math.floor(Math.random() * 11) + 20,
                                                    Math.floor(Math.random() * 11) + 20
                                                ],
                                                Shiny: false,
                                                Reason: "Leaderboard"
                                            }]
                                        }

                                        var second_reward_attachment = {
                                            Redeems: 2,
                                            PokeCredits: 15000
                                        }

                                        var third_reward_attachment = {
                                            Redeems: 1,
                                            PokeCredits: 15000
                                        }

                                        // Function to send mail to reward user
                                        mail.sendmail(first_winner.UserID, "Pokefort", "Leaderboard Winner!", `You have won the weekly leaderboard in first place by catching ${first_winner.NoOfCaught} pokemons! This is reward from us for your hardwork! Please collect the following attachment.`, first_reward_attachment, undefined, true);
                                        if (second_winner) mail.sendmail(second_winner.UserID, "Pokefort", "Leaderboard Winner!", `You have won the weekly leaderboard in second place by catching ${second_winner.NoOfCaught} pokemons! This is reward from us for your hardwork! Please collect the following attachment.`, second_reward_attachment, undefined, true);
                                        if (third_winner) mail.sendmail(third_winner.UserID, "Pokefort", "Leaderboard Winner!", `You have won the weekly leaderboard in third place by catching ${third_winner.NoOfCaught} pokemons! This is reward from us for your hardwork! Please collect the following attachment.`, third_reward_attachment, undefined, true);
                                    }

                                    leaderboard.Timestamp = current_week_monday;
                                    leaderboard.Users = [];
                                }

                                var user_id = interaction.user.id;
                                var username = interaction.user.username;
                                if (user.HideWeeklyLeaderboard) username = "???";
                                var no_of_caught = 1;

                                // Remove user from leaderboard if he already exists.
                                var users = leaderboard.Users;
                                var user_index = _.findIndex(users, { UserID: user_id });
                                if (user_index != -1) {
                                    no_of_caught = users[user_index].NoOfCaught + 1;
                                    users.splice(user_index, 1);
                                }

                                leaderboard.Users.push({ UserID: user_id, Username: username, NoOfCaught: no_of_caught });
                                leaderboard.Users = _.sortBy(leaderboard.Users, 'NoOfCaught').reverse();
                                var index_no = leaderboard.Users.findIndex(it => it.UserID == user_id);
                                if (index_no + 1 < config.LEADERBOARD_MAX_LIMIT) {
                                    leaderboard.save();
                                } else {
                                    leaderboard.Users.pop();
                                    leaderboard.save();
                                }
                            } else {
                                var user_id = interaction.user.id;
                                var username = interaction.user.username;
                                if (user.HideWeeklyLeaderboard) username = "???";
                                var no_of_caught = 1;
                                var new_leaderboard = new leaderboard_model({
                                    Type: "Weekly",
                                    Users: [{ UserID: user_id, Username: username, NoOfCaught: no_of_caught }],
                                    Timestamp: Date.now()
                                });
                                new_leaderboard.save();
                            }

                            let pokemon_data = {
                                PokemonId: pokemon["Pokemon Id"],
                                Experience: 0,
                                Level: channel.PokemonLevel,
                                Nature: channel.PokemonNature,
                                IV: channel.PokemonIV,
                                Shiny: channel.Shiny,
                                Reason: "Catched"
                            }

                            getPokemons.insertpokemon(interaction.user.id, pokemon_data).then(result => {

                                if (no_of_pokemons == 1) {
                                    user.TotalCaught = user.TotalCaught == undefined ? 1 : user.TotalCaught + 1;
                                    if (channel.Shiny) { user.TotalShiny = user.TotalShiny == undefined ? 1 : user.TotalShiny + 1; }
                                    user.DexRewards.push({
                                        PokemonId: pokemon["Pokemon Id"],
                                        RewardName: pokemon["Pokemon Name"],
                                        RewardAmount: credit_amount,
                                        RewardDescription: `${no_of_pokemons} Caught!`
                                    });
                                    user.save();
                                }
                                else {
                                    user_model.findOneAndUpdate({ UserID: interaction.user.id }, { $inc: { "DexRewards.$[el].RewardAmount": credit_amount } }, {
                                        arrayFilters: [{ "el.PokemonId": parseInt(pokemon["Pokemon Id"]) }],
                                        new: true
                                    }, (err, user) => {
                                        if (err) return console.log(err);
                                    });
                                    user_model.findOneAndUpdate({ UserID: interaction.user.id }, { $set: { "DexRewards.$[el].RewardDescription": `${no_of_pokemons} Caught!` } }, {
                                        arrayFilters: [{ "el.PokemonId": parseInt(pokemon["Pokemon Id"]) }],
                                        new: true
                                    }, (err, user) => {
                                        if (err) return console.log(err);
                                    });
                                }

                                // Adding to dex.
                                var dex_data = { PokemonId: pokemon["Pokemon Id"] };
                                getDexes.insertdex(interaction.user.id, dex_data).then(result => {

                                    var message_string = "";

                                    // Pokemon Name
                                    var message_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon["Pokemon Id"], pokemons, channel.Shiny);
                                    if (no_of_pokemons == 1) { message_string = `Congratulations <@${interaction.user.id}>. You caught a level ${channel.PokemonLevel} ${message_pokemon_name}! Added to Pokèdex.`; }
                                    else if (no_of_pokemons == 10) { message_string = `Congratulations <@${interaction.user.id}>. You caught a level ${channel.PokemonLevel} ${message_pokemon_name}! This is your 10th ${message_pokemon_name}`; }
                                    else if (no_of_pokemons == 100) { message_string = `Congratulations <@${interaction.user.id}>. You caught a level ${channel.PokemonLevel} ${message_pokemon_name}! This is your 100th ${message_pokemon_name}`; }
                                    else if (no_of_pokemons == 1000) { message_string = `Congratulations <@${interaction.user.id}>. You caught a level ${channel.PokemonLevel} ${message_pokemon_name}! This is your 1000th ${message_pokemon_name}`; }
                                    else { message_string = `Congratulations <@${interaction.user.id}>. You caught a level ${channel.PokemonLevel} ${message_pokemon_name}!`; }
                                    interaction.reply({ content: message_string });
                                    if (channel.ClearSpawns) interaction.channel.messages.fetch(channel.MessageID).then(msg => { msg.delete(); }).catch(err => { });
                                });
                            });
                        });
                    });
                });

                // Removing pokemon in channel database.
                channel_model.findOneAndUpdate({ ChannelID: interaction.channel.id }, { PokemonID: 0, PokemonLevel: 0, Shiny: false, Hint: 0, MessageCount: 0, SpawnLimit: 0 }, function (err, user) {
                    if (err) { console.log(err) }
                });
            } else return interaction.reply({ content: "That is the wrong pokemon!" });
        }
    });

}

// Word search normalizer.
String.prototype._normalize = function () {
    return this.valueOf().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

module.exports.config = {
    name: "catch",
    description: "Catch a pokemon.",
    options: [{
        name: "guess",
        description: "Guess the pokemon.",
        required: true,
        type: 3,
        min_length: 1
    }],
    aliases: []
}