const Discord = require('discord.js'); // For Embedded.
const _ = require('lodash');
const sharp = require('sharp');

// Models
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');
const raid_model = require('../models/raids');

// Utils
const getPokemons = require('../utils/getPokemon');
const moveparser = require('../utils/moveparser');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ "UserID.User2ID": interaction.user.id }, { "ChannelID": interaction.channel.id }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``accept`` command.', ephemeral: true });

        prompt_model.findOne({ $and: [{ "UserID.User1ID": prompt.UserID.User1ID }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return interaction.reply({ content: 'Requested User is already trading with someone!', ephemeral: true });

            prompt_model.findOne({ $and: [{ "UserID.User1ID": prompt.UserID.User1ID }, { "Duel.Accepted": true }] }, (err, _duel) => {
                if (err) return console.log(err);
                if (_trade) return interaction.reply({ content: 'Requested User is already dueling with someone!', ephemeral: true });

                raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
                    if (err) { console.log(err); return; }
                    if (raid && raid.CurrentDuel != undefined && raid.CurrentDuel == interaction.user.id) return interaction.reply({ content: "You can't do this while you are in a raid!", ephemeral: true });
                    else {
                        // If user prompt is for trade.
                        if (prompt.PromptType == "Trade") {
                            if (prompt.UserID.User2ID == interaction.user.id && prompt.Trade.Accepted == false) {
                                return trade(bot, interaction, prompt);
                            }
                        }
                        else if (prompt.PromptType == "Duel") {
                            if (prompt.UserID.User2ID == interaction.user.id && prompt.Duel.Accepted == false) {
                                return duel(bot, interaction, prompt, pokemons);
                            }
                        }
                        else return interaction.reply({ content: 'No prompt asked for to use ``accept`` command.', ephemeral: true });

                    }
                });
            });
        });
    });
}

// Function to accept and start duel.
function duel(bot, interaction, prompt, pokemons) {

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

                    var user1pokemon_name = getPokemons.get_pokemon_name_from_id(user1pokemon.PokemonId, pokemons, false);
                    var user2pokemon_name = getPokemons.get_pokemon_name_from_id(user2pokemon.PokemonId, pokemons, false);

                    for (var i = 0; i < 4; i++) {
                        if (user1pokemon.Moves != undefined && user1pokemon.Moves[i + 1] != undefined) {
                            var move_name = user1pokemon.Moves[i + 1];
                            if (prompt.Duel.TM_Allowed == false && move_name.includes("(TM)")) move_name = "Tackle";
                            else move_name = move_name.replace(" (TM)", "");
                            if (moveparser.movedataname(move_name).category != "Status") user1pokemon_moves.push(move_name);
                            else user1pokemon_moves.push(`Tackle`);
                        } else user1pokemon_moves.push(`Tackle`)
                    }

                    for (var i = 0; i < 4; i++) {
                        if (user2pokemon.Moves != undefined && user2pokemon.Moves[i + 1] != undefined) {
                            var move_name = user2pokemon.Moves[i + 1];
                            if (prompt.Duel.TM_Allowed == false && move_name.includes("(TM)")) move_name = "Tackle";
                            else move_name = move_name.replace(" (TM)", "");
                            if (moveparser.movedataname(move_name).category != "Status") user2pokemon_moves.push(move_name);
                            else user2pokemon_moves.push(`Tackle`);
                        } else user2pokemon_moves.push(`Tackle`)
                    }

                    let ev = 0;
                    var pokemon1_info = pokemons.filter(it => it["Pokemon Id"] == user1pokemon.PokemonId)[0];
                    var pokemon1_hp = _.floor(0.01 * (2 * pokemon1_info["Health Stat"] + user1pokemon.IV[0] + _.floor(0.25 * ev)) * user1pokemon.Level) + user1pokemon.Level + 10;
                    var pokemon1_attack = _.floor(0.01 * (2 * pokemon1_info["Attack Stat"] + user1pokemon.IV[1] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon1_defense = _.floor(0.01 * (2 * pokemon1_info["Defense Stat"] + user1pokemon.IV[2] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon1_spattack = _.floor(0.01 * (2 * pokemon1_info["Special Attack Stat"] + user1pokemon.IV[3] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon1_spdefense = _.floor(0.01 * (2 * pokemon1_info["Special Defense Stat"] + user1pokemon.IV[4] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;
                    var pokemon1_speed = _.floor(0.01 * (2 * pokemon1_info["Speed Stat"] + user1pokemon.IV[5] + _.floor(0.25 * ev)) * user1pokemon.Level) + 5;

                    //Pokemon 1 nature update.
                    var pokemon1_nature = nature_of(user1pokemon.Nature);
                    pokemon1_hp += percentage(pokemon1_hp, pokemon1_nature[1]);
                    pokemon1_attack += percentage(pokemon1_attack, pokemon1_nature[2]);
                    pokemon1_defense += percentage(pokemon1_defense, pokemon1_nature[3]);
                    pokemon1_spattack += percentage(pokemon1_spattack, pokemon1_nature[4]);
                    pokemon1_spdefense += percentage(pokemon1_spdefense, pokemon1_nature[5]);
                    pokemon1_speed += percentage(pokemon1_speed, pokemon1_nature[6]);


                    var pokemon2_info = pokemons.filter(it => it["Pokemon Id"] == user2pokemon.PokemonId)[0];
                    var pokemon2_hp = _.floor(0.01 * (2 * pokemon2_info["Health Stat"] + user2pokemon.IV[0] + _.floor(0.25 * ev)) * user2pokemon.Level) + user2pokemon.Level + 10;
                    var pokemon2_attack = _.floor(0.01 * (2 * pokemon2_info["Attack Stat"] + user2pokemon.IV[1] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;
                    var pokemon2_defense = _.floor(0.01 * (2 * pokemon2_info["Defense Stat"] + user2pokemon.IV[2] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;
                    var pokemon2_spattack = _.floor(0.01 * (2 * pokemon2_info["Special Attack Stat"] + user2pokemon.IV[3] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;
                    var pokemon2_spdefense = _.floor(0.01 * (2 * pokemon2_info["Special Defense Stat"] + user2pokemon.IV[4] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;
                    var pokemon2_speed = _.floor(0.01 * (2 * pokemon2_info["Speed Stat"] + user2pokemon.IV[5] + _.floor(0.25 * ev)) * user2pokemon.Level) + 5;

                    //Pokemon 2 Nature update.
                    var pokemon2_nature = nature_of(user2pokemon.Nature);
                    pokemon2_hp += percentage(pokemon2_hp, pokemon2_nature[1]);
                    pokemon2_attack += percentage(pokemon2_attack, pokemon2_nature[2]);
                    pokemon2_defense += percentage(pokemon2_defense, pokemon2_nature[3]);
                    pokemon2_spattack += percentage(pokemon2_spattack, pokemon2_nature[4]);
                    pokemon2_spdefense += percentage(pokemon2_spdefense, pokemon2_nature[5]);
                    pokemon2_speed += percentage(pokemon2_speed, pokemon2_nature[6]);

                    // Turn chooser
                    prompt.Duel.Turn = 1;

                    // Shedinja HP expection
                    if (user1pokemon.PokemonId == "420") pokemon1_hp = 1;
                    if (user2pokemon.PokemonId == "420") pokemon2_hp = 1;

                    // For pokemon 1
                    prompt.Duel.User1Pokemon.PokemonUserID = user1.Selected;
                    prompt.Duel.User1Pokemon.PokemonXP = user1pokemon.Experience;
                    prompt.Duel.User1Pokemon.PokemonName = user1pokemon_name;
                    prompt.Duel.User1Pokemon.PokemonID = user1pokemon.PokemonId;
                    prompt.Duel.User1Pokemon.PokemonLevel = user1pokemon.Level;
                    prompt.Duel.User1Pokemon.Attack = pokemon1_attack;
                    prompt.Duel.User1Pokemon.Defense = pokemon1_defense;
                    prompt.Duel.User1Pokemon.SpAttack = pokemon1_spattack;
                    prompt.Duel.User1Pokemon.SpDefense = pokemon1_spdefense;
                    prompt.Duel.User1Pokemon.Speed = pokemon1_speed;
                    prompt.Duel.User1Pokemon.ActiveHP = pokemon1_hp;
                    prompt.Duel.User1Pokemon.TotalHP = pokemon1_hp;
                    prompt.Duel.User1Pokemon.Moves = user1pokemon_moves;
                    prompt.Duel.User1Pokemon.DuelDM = user1.DuelDM != undefined ? user1.DuelDM : false;
                    prompt.Duel.User1Pokemon.Traded = user1pokemon.Reason == "Traded" ? true : false;
                    prompt.Duel.User1Pokemon.Shiny = user1pokemon.Shiny == true ? true : false;
                    prompt.Duel.User1Pokemon.Held = user1pokemon.Held != undefined ? user1pokemon.Held : null;

                    // For pokemon 2
                    prompt.Duel.User2Pokemon.PokemonUserID = user2.Selected;
                    prompt.Duel.User2Pokemon.PokemonXP = user2pokemon.Experience;
                    prompt.Duel.User2Pokemon.PokemonName = user2pokemon_name;
                    prompt.Duel.User2Pokemon.PokemonID = user2pokemon.PokemonId;
                    prompt.Duel.User2Pokemon.PokemonLevel = user2pokemon.Level;
                    prompt.Duel.User2Pokemon.Attack = pokemon2_attack;
                    prompt.Duel.User2Pokemon.Defense = pokemon2_defense;
                    prompt.Duel.User2Pokemon.SpAttack = pokemon2_spattack;
                    prompt.Duel.User2Pokemon.SpDefense = pokemon2_spdefense;
                    prompt.Duel.User2Pokemon.Speed = pokemon2_speed;
                    prompt.Duel.User2Pokemon.ActiveHP = pokemon2_hp;
                    prompt.Duel.User2Pokemon.TotalHP = pokemon2_hp;
                    prompt.Duel.User2Pokemon.Moves = user2pokemon_moves;
                    prompt.Duel.User2Pokemon.DuelDM = user2.DuelDM != undefined ? user2.DuelDM : false;
                    prompt.Duel.User2Pokemon.Traded = user2pokemon.Reason == "Traded" ? true : false;
                    prompt.Duel.User2Pokemon.Shiny = user2pokemon.Shiny == true ? true : false;
                    prompt.Duel.User2Pokemon.Held = user2pokemon.Held != undefined ? user2pokemon.Held : null;

                    // Image generation.
                    var image1_url = getPokemons.imagefromid(user1pokemon.PokemonId, pokemons, user1pokemon.Shiny);
                    var image2_url = getPokemons.imagefromid(user2pokemon.PokemonId, pokemons, user2pokemon.Shiny);

                    // Image 1
                    sharp(pokemon1_speed >= pokemon2_speed ? image1_url : image2_url).resize({ width: 350, height: 350 }).toBuffer().then(function (one) {
                        // Image 2
                        sharp(pokemon1_speed <= pokemon2_speed ? image1_url : image2_url).resize({ width: 350, height: 350 }).toBuffer().then(function (two) {
                            sharp("./assets/duel_images/background.jpg")
                                .composite([{ input: one, top: 20, left: 40 }, { input: two, top: 20, left: 550 }])
                                .jpeg({ quality: 100 })
                                .toBuffer("jpeg").then((image_buffer) => {

                                    prompt.Duel.ImageCache = image_buffer.toString('base64');
                                    prompt.Duel.Accepted = true;
                                    prompt.save().then(() => {
                                        var embed = new Discord.EmbedBuilder();
                                        embed.setColor(interaction.guild.members.me.displayHexColor);
                                        embed.setImage('attachment://img.jpeg')
                                        embed.setTitle(`${user1name.toUpperCase()} VS ${user2name.toUpperCase()}`);

                                        if (pokemon1_speed >= pokemon2_speed) {
                                            embed.addFields([{ name: `${user1name}'s Pokémon`, value: `${user1pokemon_name} ${pokemon1_hp}/${pokemon1_hp}HP`, inline: true },
                                            { name: `${user2name}'s Pokémon`, value: `${user2pokemon_name} ${pokemon2_hp}/${pokemon2_hp}HP`, inline: true }]);
                                        } else {
                                            embed.addFields([{ name: `${user2name}'s Pokémon`, value: `${user2pokemon_name} ${pokemon2_hp}/${pokemon2_hp}HP`, inline: true },
                                            { name: `${user1name}'s Pokémon`, value: `${user1pokemon_name} ${pokemon1_hp}/${pokemon1_hp}HP`, inline: true }]);
                                        }

                                        embed.setFooter({ text: `Use /dm to mute the duel instructions.` });
                                        interaction.reply({ embeds: [embed], files: [{ attachment: image_buffer, name: "img.jpeg" }] });

                                        if (user1.DuelDM != undefined && user1.DuelDM != true) {
                                            var usr_embed = new Discord.EmbedBuilder();
                                            usr_embed.setColor(interaction.guild.members.me.displayHexColor);
                                            usr_embed.setTitle(`Battle VS ${user2name}`);
                                            var description = "Pick a move by typing the corresponding command in the channel where you started the duel."
                                            description += "\n\n";
                                            description += "Available moves:\n\n"
                                            description += `${user1pokemon_moves[0]} /use 1\n\n`;
                                            description += `${user1pokemon_moves[1]} /use 2\n\n`;
                                            description += `${user1pokemon_moves[2]} /use 3\n\n`;
                                            description += `${user1pokemon_moves[3]} /use 4\n\n`;
                                            usr_embed.setDescription(description);

                                            // Send Message
                                            if (user1.DuelDM != true) bot.users.cache.get(user1.UserID).send(usr_embed);

                                        }
                                    });
                                });
                        });
                    });
                });
            });
        });
    });
}

// Function to accept and start trade.
function trade(bot, interaction, prompt) {
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

            var embed = new Discord.EmbedBuilder();
            embed.setTitle(`Trade between ${user1name} and ${user2name}`);
            embed.setDescription(`For instructions on how to trade, see /help trade.`)
            embed.setColor(interaction.member.displayHexColor);
            embed.addFields([{ name: `${user1name + '#' + tag1}'s is offering`, value: '``` ```', inline: false },
            { name: `${user2name + '#' + tag2}'s is offering`, value: '``` ```', inline: false }]);
            interaction.reply({ embeds: [embed], fetchReply: true }).then(msg => {
                prompt.Trade.Accepted = true;
                prompt.Trade.MessageID = msg.id;
                prompt.save();
            });
        });
    });
}

// Function to get the nature from number.
function nature_of(int) {
    if (int == 0) { return ["Adamant", 0, 10, 0, -10, 0, 0] }
    else if (int == 1) { return ["Adamant", 0, 10, 0, -10, 0, 0] }
    else if (int == 2) { return ["Bashful", 0, 0, 0, 0, 0, 0] }
    else if (int == 3) { return ["Bold", 0, -10, 10, 0, 0, 0] }
    else if (int == 4) { return ["Brave", 0, 10, 0, 0, 0, -10] }
    else if (int == 5) { return ["Calm", 0, -10, 0, 0, 10, 0] }
    else if (int == 6) { return ["Careful", 0, 0, 0, -10, 10, 0] }
    else if (int == 7) { return ["Docile", 0, 0, 0, 0, 0, 0] }
    else if (int == 8) { return ["Gentle", 0, 0, -10, 0, 10, 0] }
    else if (int == 9) { return ["Hardy", 0, 0, 0, 0, 0, 0] }
    else if (int == 10) { return ["Hasty", 0, 0, -10, 0, 0, 10] }
    else if (int == 11) { return ["Impish", 0, 0, 10, -10, 0, 0] }
    else if (int == 12) { return ["Jolly", 0, 0, 0, -10, 0, 10] }
    else if (int == 13) { return ["Lax", 0, 10, 0, 0, -10, 0] }
    else if (int == 14) { return ["Lonely", 0, 10, -10, 0, 0, 0] }
    else if (int == 15) { return ["Mild", 0, 0, -10, 10, 0, 0] }
    else if (int == 16) { return ["Modest", 0, 0, 0, 10, 0, -10] }
    else if (int == 17) { return ["Naive", 0, 0, 0, 0, -10, 10] }
    else if (int == 18) { return ["Naughty", 0, 10, 0, 0, -10, 0] }
    else if (int == 19) { return ["Quiet", 0, 0, 0, 10, 0, -10] }
    else if (int == 20) { return ["Quirky", 0, 0, 0, 0, 0, 0] }
    else if (int == 21) { return ["Rash", 0, 0, 0, 10, -10, 0] }
    else if (int == 22) { return ["Relaxed", 0, 0, 10, 0, 0, -10] }
    else if (int == 23) { return ["Sassy", 0, 0, 0, 0, 10, -10] }
    else if (int == 24) { return ["Serious", 0, 0, 0, 0, 0, 0] }
    else if (int == 25) { return ["Timid", 0, -10, 0, 0, 0, 10] }
}

// Percentage calculation.
function percentage(percent, total) {
    return parseInt(((percent / 100) * total).toFixed(0));
}

module.exports.config = {
    name: "accept",
    description: "Accept request like trade/duel.",
    aliases: []
}