const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const mergeImages = require('merge-images-v2');
const Canvas = require('canvas');

// Models
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const moveparser = require('../utils/moveparser');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    prompt_model.findOne({ $and: [{ "UserID.User2ID": message.author.id }, { "ChannelID": message.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``accept`` command.');

        prompt_model.findOne({ $and: [{ "UserID.User1ID": prompt.UserID.User1ID }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return message.channel.send('Requested User is already trading with someone!');

            prompt_model.findOne({ $and: [{ "UserID.User1ID": prompt.UserID.User1ID }, { "Duel.Accepted": true }] }, (err, _duel) => {
                if (err) return console.log(err);
                if (_trade) return message.channel.send('Requested User is already dueling with someone!');

                // If user prompt is for trade.
                if (prompt.PromptType == "Trade") {
                    if (prompt.UserID.User2ID == message.author.id && prompt.Trade.Accepted == false) {
                        return trade(bot, message, prefix, prompt);
                    }
                }
                else if (prompt.PromptType == "Duel") {
                    if (prompt.UserID.User2ID == message.author.id && prompt.Duel.Accepted == false) {
                        return duel(bot, message, prefix, prompt, pokemons);
                    }
                }
                else return message.channel.send('No prompt asked for to use ``accept`` command.');

            });
        });
    });
}

// Function to accept and start duel.
function duel(bot, message, prefix, prompt, pokemons) {

    var user1id = prompt.UserID.User1ID;
    var user2id = prompt.UserID.User2ID;

    var user1name = prompt.Duel.User1name;
    var user2name = prompt.Duel.User2name;

    var user1pokemon = null;
    var user2pokemon = null;

    var user1pokemon_moves = [];
    var user2pokemon_moves = [];

    user_model.findOne({ UserID: user1id }, (err, user1) => {
        user_model.findOne({ UserID: user2id }, (err, user2) => {

            getPokemons.getallpokemon(user1id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                user1pokemon = user_pokemons.filter(it => it._id == user1.Selected)[0];

                getPokemons.getallpokemon(user2id).then(pokemons_from_database => {
                    var user_pokemons = pokemons_from_database;
                    user2pokemon = user_pokemons.filter(it => it._id == user2.Selected)[0];

                    var user1pokemon_name = get_pokemon_full_name(user1pokemon.PokemonId, pokemons);
                    var user2pokemon_name = get_pokemon_full_name(user2pokemon.PokemonId, pokemons);

                    for (var i = 0; i < 4; i++) {
                        if (user1pokemon.Moves != undefined && user1pokemon.Moves[i + 1] != undefined) {
                            var move_name = user1pokemon.Moves[i + 1].replace(" (TM)", "");
                            if (moveparser.movedataname(move_name).category != "Status") user1pokemon_moves.push(move_name);
                            else user1pokemon_moves.push(`Tackle`);
                        } else user1pokemon_moves.push(`Tackle`)
                    }

                    for (var i = 0; i < 4; i++) {
                        if (user2pokemon.Moves != undefined && user2pokemon.Moves[i + 1] != undefined) {
                            var move_name = user2pokemon.Moves[i + 1].replace(" (TM)", "");
                            if (moveparser.movedataname(move_name).category != "Status") user2pokemon_moves.push(move_name);
                            else user2pokemon_moves.push(`Tackle`);
                        } else user2pokemon_moves.push(`Tackle`)
                    }

                    let ev = 0;
                    var pokemon1_info = pokemons.filter(it => it["Pokemon Id"] == user1pokemon.PokemonId)[0];
                    var pokemon1_hp = _.floor(0.01 * (2 * pokemon1_info["Health Stat"] + user1pokemon.IV[0] + _.floor(0.25 * ev)) * user1pokemon.Level) + user1pokemon.Level + 10;
                    var pokemon1_attack = _.floor(0.01 * (2 * pokemon1_info["Attack Stat"] + user1pokemon.IV[1] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon1_defense = _.floor(0.01 * (2 * pokemon1_info["Defense Stat"] + user1pokemon.IV[2] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon2_info = pokemons.filter(it => it["Pokemon Id"] == user2pokemon.PokemonId)[0];
                    var pokemon2_hp = _.floor(0.01 * (2 * pokemon2_info["Health Stat"] + user2pokemon.IV[0] + _.floor(0.25 * ev)) * user2pokemon.Level) + user2pokemon.Level + 10;
                    var pokemon2_attack = _.floor(0.01 * (2 * pokemon2_info["Attack Stat"] + user2pokemon.IV[1] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;
                    var pokemon2_defense = _.floor(0.01 * (2 * pokemon2_info["Defense Stat"] + user2pokemon.IV[2] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;

                    // Turn chooser
                    prompt.Duel.Turn = 1;

                    // For pokemon 1
                    prompt.Duel.User1Pokemon.PokemonUserID = user1.Selected;
                    prompt.Duel.User1Pokemon.PokemonXP = user1pokemon.Experience;
                    prompt.Duel.User1Pokemon.PokemonName = user1pokemon_name;
                    prompt.Duel.User1Pokemon.PokemonID = user1pokemon.PokemonId;
                    prompt.Duel.User1Pokemon.PokemonLevel = user1pokemon.Level;
                    prompt.Duel.User1Pokemon.Attack = pokemon1_attack;
                    prompt.Duel.User1Pokemon.Defense = pokemon1_defense;
                    prompt.Duel.User1Pokemon.ActiveHP = pokemon1_hp;
                    prompt.Duel.User1Pokemon.TotalHP = pokemon1_hp;
                    prompt.Duel.User1Pokemon.Moves = user1pokemon_moves;
                    prompt.Duel.User1Pokemon.Traded = user1pokemon.Reason == "Traded" ? true : false;
                    prompt.Duel.User1Pokemon.Shiny = user1pokemon.Shiny == true ? true : false;

                    // For pokemon 2
                    prompt.Duel.User2Pokemon.PokemonUserID = user2.Selected;
                    prompt.Duel.User2Pokemon.PokemonXP = user2pokemon.Experience;
                    prompt.Duel.User2Pokemon.PokemonName = user2pokemon_name;
                    prompt.Duel.User2Pokemon.PokemonID = user2pokemon.PokemonId;
                    prompt.Duel.User2Pokemon.PokemonLevel = user2pokemon.Level;
                    prompt.Duel.User2Pokemon.Attack = pokemon2_attack;
                    prompt.Duel.User2Pokemon.Defense = pokemon2_defense;
                    prompt.Duel.User2Pokemon.ActiveHP = pokemon2_hp;
                    prompt.Duel.User2Pokemon.TotalHP = pokemon2_hp;
                    prompt.Duel.User2Pokemon.Moves = user2pokemon_moves;
                    prompt.Duel.User2Pokemon.Traded = user2pokemon.Reason == "Traded" ? true : false;
                    prompt.Duel.User2Pokemon.Shiny = user2pokemon.Shiny == true ? true : false;

                    // Image generation.
                    var image1_url = getPokemons.imagefromid(user1pokemon.PokemonId, pokemons, user1pokemon.Shiny);
                    var image2_url = getPokemons.imagefromid(user2pokemon.PokemonId, pokemons, user2pokemon.Shiny);

                    mergeImages(["./assets/duel_images/background.jpg",
                        { src: image1_url, x: 40, y: 0, width: 350, height: 350 }, { src: image2_url, x: 550, y: 0, width: 350, height: 350 }], {
                        Canvas: Canvas
                    }).then(b64 => {
                        const img_data = b64.split(',')[1];
                        prompt.Duel.ImageCache = img_data;
                        const img_buffer = new Buffer.from(img_data, 'base64');
                        const image_file = new Discord.MessageAttachment(img_buffer, 'img.jpeg');

                        prompt.Duel.Accepted = true;
                        prompt.save().then(() => {
                            embed = new Discord.MessageEmbed();
                            embed.setColor(message.guild.me.displayHexColor);
                            embed.attachFiles(image_file)
                            embed.setImage('attachment://img.jpeg')
                            embed.setTitle(`${user1name.toUpperCase()} VS ${user2name.toUpperCase()}`);
                            embed.addField(`${user1name}'s Pokémon`, `${user1pokemon_name} ${pokemon1_hp}/${pokemon1_hp}HP`, true);
                            embed.addField(`${user2name}'s Pokémon`, `${user2pokemon_name} ${pokemon2_hp}/${pokemon2_hp}HP`, true);
                            message.channel.send(embed);
                        });
                    });

                });
            });
        });
    });
}

// Function to accept and start trade.
function trade(bot, message, prefix, prompt) {
    var user1id = prompt.UserID.User1ID;
    var user2id = prompt.UserID.User2ID;

    var user1name = "";
    var user2name = "";
    var tag1 = "";
    var tag2 = "";

    bot.users.fetch(user1id.toString()).then(user_data => {
        user1name = user_data.username;
        tag1 = user_data.discriminator;

        bot.users.fetch(user2id.toString()).then(user_data => {
            user2name = user_data.username;
            tag2 = user_data.discriminator;

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`Trade between ${user1name} and ${user2name}`);
            embed.setDescription(`For instructions on how to trade, see ${prefix}help trade.`)
            embed.setColor(message.member.displayHexColor);
            embed.addField(`${user1name + '#' + tag1}'s is offering`, '``` ```', false);
            embed.addField(`${user2name + '#' + tag2}'s is offering`, '``` ```', false);
            message.channel.send(embed).then(msg => {
                prompt.Trade.Accepted = true;
                prompt.Trade.MessageID = msg.id;
                prompt.save();
            });
        });
    });
}

// Get pokemon name from pokemon ID.
function get_pokemon_full_name(selected_pokemonid, pokemons) {
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemonid)[0];

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

    return pokemon_name;
}

// Function to get the nature from number.
function nature_of(int) {
    if (int == 1) { return "Adament" }
    else if (int == 2) { return "Bashful" }
    else if (int == 3) { return "Bold" }
    else if (int == 4) { return "Brave" }
    else if (int == 5) { return "Calm" }
    else if (int == 6) { return "Careful" }
    else if (int == 7) { return "Docile" }
    else if (int == 8) { return "Gentle" }
    else if (int == 9) { return "Hardy" }
    else if (int == 10) { return "Hasty" }
    else if (int == 11) { return "Impish" }
    else if (int == 12) { return "Jolly" }
    else if (int == 13) { return "Lax" }
    else if (int == 14) { return "Lonely" }
    else if (int == 15) { return "Mild" }
    else if (int == 16) { return "Modest" }
    else if (int == 17) { return "Naive" }
    else if (int == 18) { return "Naughty" }
    else if (int == 19) { return "Quiet" }
    else if (int == 20) { return "Quirky" }
    else if (int == 21) { return "Rash" }
    else if (int == 22) { return "Relaxed" }
    else if (int == 23) { return "Sassy" }
    else if (int == 24) { return "Serious" }
    else if (int == 25) { return "Timid" }
}

module.exports.config = {
    name: "accept",
    aliases: []
}