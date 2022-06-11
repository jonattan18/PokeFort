const Discord = require('discord.js');

// Models
const user_model = require('../models/user');
const raid_model = require('../models/raids');

//Utils
const getPokemons = require('../utils/getPokemon');
const { floor } = require('lodash');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length == 1 && args[0].toLowerCase() == "spawn") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ Trainers: { $in: message.author.id } }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                message.channel.send(`You are already in a raid.`);
                return;
            }
            else {
                // Get user data.
                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                    if (err) { console.log(err); return; }
                    if (user) {
                        var last_raid_time = user.RaidSpawn;
                        // check if 3 hours passed since last raid spawn.
                        // Remove me last ride cooldown.
                        if (last_raid_time == undefined || (new Date().getTime() - last_raid_time) < 10800000) {
                            // Decide raid boss based on random.
                            const mythical_pokemons = pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL");
                            const ultra_beast_pokemons = pokemons.filter(it => it["Primary Ability"] === "Beast Boost" && it["Alternate Form Name"] === "NULL");
                            const legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL");
                            const sub_legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL");
                            const gigantamax_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Gigantamax");
                            const mega_pokemons = pokemons.filter(it => it["Alternate Form Name"].includes("Mega"));
                            const galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar");
                            const alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola");
                            const hisuian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Hisuian");

                            var raid_pokemons = mythical_pokemons.concat(ultra_beast_pokemons, legendary_pokemons, sub_legendary_pokemons, galarian_pokemons, alolan_pokemons, mega_pokemons, hisuian_pokemons);
                            var raid_boss = raid_pokemons[Math.floor(Math.random() * raid_pokemons.length)];
                            var raid_boss_name = getPokemons.get_pokemon_name_from_id(raid_boss["Pokemon Id"], pokemons, false);

                            // Decide Easy, Normal, Hard, Challenge, Intense based on random.
                            var difficulty = Math.floor(Math.random() * 4);
                            var raid_type = "";
                            var raid_level = 0;
                            var raid_rewards = "";
                            var raid_time_left = 0;
                            switch (difficulty) {
                                case 0:
                                    raid_type = "Easy";
                                    raid_level = randomInteger(200, 300);
                                    raid_rewards = `-Credits\n-Redeems: 0.1% Chance\n-Wishing Pieces: 0.25% Chance\n-${raid_boss_name}: 0.05% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`
                                    raid_time_left = new Date().setSeconds(new Date().getSeconds() + 7199);
                                    break;
                                case 1:
                                    raid_type = "Normal";
                                    raid_level = randomInteger(600, 800);
                                    raid_rewards = `-Credits\n-Redeems: 0.1% Chance\n-Wishing Pieces: 1% Chance\n-${raid_boss_name}: 1% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
                                    raid_time_left = new Date().setSeconds(new Date().getSeconds() + 7199);
                                    break;
                                case 2:
                                    raid_type = "Hard";
                                    raid_level = randomInteger(1600, 1800);
                                    raid_rewards = `-Credits\n-Redeems: 0.5% Chance\n-Wishing Pieces: 5% Chance\n-${raid_boss_name}: 5% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
                                    raid_time_left = new Date().setSeconds(new Date().getSeconds() + 10799);
                                    break;
                                case 3:
                                    raid_type = "Challenge";
                                    raid_level = randomInteger(2600, 2800);
                                    raid_rewards = `-Credits\n-Redeems: 1% Chance\n-Wishing Pieces: 10% Chance\n-${raid_boss_name}: 10% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
                                    raid_time_left = new Date().setSeconds(new Date().getSeconds() + 14399);
                                    break;
                                case 4:
                                    raid_type = "Intense";
                                    raid_level = randomInteger(3400, 3500);
                                    raid_rewards = `-Credits\n-Redeems: 5% Chance\n-Wishing Pieces: 25% Chance\n-${raid_boss_name}: 25% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
                                    raid_time_left = new Date().setSeconds(new Date().getSeconds() + 14399);
                                    break;
                            }

                            var stats = getRaidStats([raid_boss["Health Stat"], raid_boss["Attack Stat"], raid_boss["Defense Stat"], raid_boss["Special Attack Stat"], raid_boss["Special Defense Stat"], raid_boss["Speed Stat"]], raid_level, difficulty);

                            // Stats String
                            var stats_string = `Health: ${stats[0]}\nAttack: ${stats[1]}\nDefense: ${stats[2]}\nSpecial Attack: ${stats[3]}\nSpecial Defense: ${stats[4]}\nSpeed: ${stats[5]}`;
                            var raid_boss_image = getPokemons.imagefromid(raid_boss["Pokemon Id"], pokemons, false, true);

                            // Time String
                            var raid_time_left_string = "";
                            var future_timeout = raid_time_left;
                            raid_time_left = new Date(new Date(raid_time_left).getTime() - new Date().getTime());
                            raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                            var embed = new Discord.MessageEmbed();
                            embed.attachFiles(raid_boss_image[1]);
                            embed.setTitle(`${message.author.username} has started a raid battle!`);
                            embed.addField(`Level ${raid_level} ${raid_boss_name}`, stats_string, false);
                            embed.addField(`Trainers:`, `Trainer #1: ${message.author.tag}\nTrainer #2: None\nTrainer #3: None\nTrainer #4: None`, false);
                            embed.addField(`Obtainable Rewards:`, raid_rewards, false);
                            embed.setImage('attachment://' + raid_boss_image[0] + ".png")

                            var unique = String(new Date().valueOf()).substring(3, 13);

                            description = `**RaidID: ${unique}\n` + `Difficulty: ${raid_type}\n` + `Time Left: ${raid_time_left_string}**`;
                            embed.setDescription(description);
                            embed.setFooter(`To join this raid, do ${prefix}r join ${unique}. To start the raid, the raid leader needs to do ${prefix}r start. To duel the raid boss, do ${prefix}r duel.`)

                            // Start server side works.
                            raid_data = new raid_model({
                                RaidID: unique,
                                RaidType: difficulty,
                                Started: false,
                                Timestamp: future_timeout,
                                RaidPokemon: {
                                    ID: raid_boss["Pokemon Id"],
                                    Name: raid_boss_name,
                                    Level: raid_level,
                                    Health: stats[0],
                                    Attack: stats[1],
                                    Defense: stats[2],
                                    SpAttack: stats[3],
                                    SpDefense: stats[4],
                                    Speed: stats[5]
                                },
                                Trainers: [message.author.id],
                                TrainersTag: [message.author.tag]
                            });

                            // Save user data.
                            user.RaidsSpawned = user.RaidsSpawned != undefined ? user.RaidsSpawned + 1 : 1;
                            user.RaidSpawn = Date.now();
                            raid_data.save().then(() => {
                                user.save().then(() => {
                                    message.channel.send(embed);
                                });
                            });
                        }
                        else {
                            // Get time left until next raid spawn in hh:mm:ss format.
                            var time_left = new Date(last_raid_time + 10800000 - Date.now());
                            var time_left_string = time_left.getUTCHours() + ":" + time_left.getUTCMinutes() + ":" + time_left.getUTCSeconds();
                            return message.channel.send(`Time left to be able to spawn a raid: ${time_left_string}`);
                        }
                    }
                });
            }
        });
    }
    else if (args.length == 2 && args[0] == "join" && !isInt(args[1])) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ Trainers: { $in: message.author.id } }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                message.channel.send(`You are already in a raid.`);
                return;
            }
            else {
                raid_model.findOne({ $and: [{ RaidID: args[1] }, { Timestamp: { $gt: Date.now() } }] }, (err, raid_data) => {
                    if (err) { console.log(err); return; }
                    if (!raid_data) return message.channel.send(`No raid found with that ID.`);
                    else {
                        if (raid_data.Started) return message.channel.send(`Raid has already started.`);
                        else {
                            if (raid_data.Trainers.length == 4) return message.channel.send(`The specified raid already has 4 trainers.`);
                            else {
                                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                                    if (err) { console.log(err); return; }
                                    if (user) {
                                        user.RaidsJoined = user.RaidsJoined != undefined ? user.RaidsJoined + 1 : 1;
                                        raid_data.Trainers.push(message.author.id);
                                        raid_data.TrainersTag.push(message.author.tag);
                                        raid_data.save().then(() => {
                                            user.save().then(() => {
                                                // Stats String
                                                var stats_string = `Health: ${raid_data.RaidPokemon.Health}\nAttack: ${raid_data.RaidPokemon.Attack}\nDefense: ${raid_data.RaidPokemon.Defense}\nSpecial Attack: ${raid_data.RaidPokemon.SpAttack}\nSpecial Defense: ${raid_data.RaidPokemon.SpDefense}\nSpeed: ${raid_data.RaidPokemon.Speed}`;
                                                var raid_boss_image = getPokemons.imagefromid(raid_data.RaidPokemon.ID.toString(), pokemons, false, true);

                                                // Time String
                                                var raid_time_left_string = "";
                                                raid_time_left = new Date(new Date(raid_data.Timestamp).getTime() - new Date().getTime());
                                                raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                                                var embed = new Discord.MessageEmbed();
                                                embed.attachFiles(raid_boss_image[1]);
                                                embed.setTitle(`${message.author.username} has joined a raid battle!`);
                                                embed.addField(`Level ${raid_data.RaidPokemon.Level} ${raid_data.RaidPokemon.Name}`, stats_string, false);

                                                var trainer_data = "";
                                                for (var i = 0; i < 4; i++) {
                                                    trainer_data += `Trainer #${i + 1}: ${raid_data.TrainersTag[i] != undefined ? raid_data.TrainersTag[i] : "None"}\n`
                                                }

                                                embed.addField(`Trainers:`, trainer_data, false);
                                                embed.addField(`Obtainable Rewards:`, getRewards(raid_data.RaidType, raid_data.RaidPokemon.Name), false);
                                                embed.setImage('attachment://' + raid_boss_image[0] + ".png")
                                                description = `**RaidID: ${raid_data.RaidID}\n` + `Difficulty: ${getDifficultyString(raid_data.RaidType)}\n` + `Time Left: ${raid_time_left_string}**`;
                                                embed.setDescription(description);
                                                embed.setFooter(`To join this raid, do ${prefix}r join ${raid_data.RaidID}. To start the raid, the raid leader needs to do ${prefix}r start. To duel the raid boss, do ${prefix}r duel.`)
                                                message.channel.send(embed);
                                            });
                                        });
                                    }
                                });
                            }
                        }
                    }
                });
            }
        });
    }
    else if (args.length == 1 && args[0] == "leave") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ Trainers: { $in: message.author.id } }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                // Get user data.
                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                    if (err) { console.log(err); return; }
                    if (user) {
                        user.RaidsLeft = user.RaidsLeft != undefined ? user.RaidsLeft + 1 : 1;
                        var remove_index = raid.Trainers.indexOf(message.author.id);
                        raid.Trainers.splice(remove_index, 1);
                        raid.TrainersTag.splice(remove_index, 1);
                        raid.save().then(() => {
                            user.save().then(() => {
                                message.channel.send(`You have left the raid.`);
                            });
                        });
                    }
                });
            }
            else return message.channel.send("You are not in a raid.");
        });
    }
    else return message.channel.send("Invalid syntax.");
}

// Decide raid stats calculation formula.
function getRaidStats(base_stat, raid_level, difficulty) {
    var raid_stats = [];
    raid_stats.push(floor(floor(0.01 * (2 * 100 + Math.floor(Math.random() * 31)) * raid_level) + raid_level * 10 * 2.31 * 2.11));

    switch (difficulty) {
        // Easy
        case 0:
            for (var i = 1; i < 6; i++) {
                raid_stats.push(floor(floor(0.01 * (2 * base_stat[i] + Math.floor(Math.random() * 31)) * raid_level) / 1.81));
            }
            break;
        // Normal
        case 1:
            for (var i = 1; i < 6; i++) {
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + Math.floor(Math.random() * 31)) * raid_level) / 2.22) / 2.12));
            }
            break;
        // Hard
        case 2:
            for (var i = 1; i < 6; i++) {
                raid_stats.push(floor(floor(0.01 * (2 * base_stat[i] + Math.floor(Math.random() * 31)) * raid_level) / 3.2 / 3.2) + 20);
            }
            break;
        // Challenge
        case 3:
            for (var i = 1; i < 6; i++) {
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + Math.floor(Math.random() * 31)) * raid_level) / 4) / 3.3));
            }
            break;
        // Intense
        case 4:
            for (var i = 1; i < 6; i++) {
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + Math.floor(Math.random() * 31)) * raid_level) / 5.2) / 3) + Math.floor(Math.random() * 30));
            }
            break;
    }
    return raid_stats;
}

// Function to convert difficulty to string.
function getDifficultyString(difficulty) {
    switch (difficulty) {
        case 0:
            return "Easy";
        case 1:
            return "Normal";
        case 2:
            return "Hard";
        case 3:
            return "Challenge";
        case 4:
            return "Intense";
    }
}

// Function to get obtainable rewards.
function getRewards(difficulty, raid_boss_name) {
    var raid_rewards = "";
    switch (difficulty) {
        // Easy
        case 0:
            raid_rewards = `-Credits\n-Redeems: 0.1% Chance\n-Wishing Pieces: 0.25% Chance\n-${raid_boss_name}: 0.05% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`
            break;
        // Normal
        case 1:
            raid_rewards = `-Credits\n-Redeems: 0.1% Chance\n-Wishing Pieces: 1% Chance\n-${raid_boss_name}: 1% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
            break;
        // Hard
        case 2:
            raid_rewards = `-Credits\n-Redeems: 0.5% Chance\n-Wishing Pieces: 5% Chance\n-${raid_boss_name}: 5% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
            break;
        // Challenge
        case 3:
            raid_rewards = `-Credits\n-Redeems: 1% Chance\n-Wishing Pieces: 10% Chance\n-${raid_boss_name}: 10% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
            break;
        // Intense
        case 4:
            raid_rewards = `-Credits\n-Redeems: 5% Chance\n-Wishing Pieces: 25% Chance\n-${raid_boss_name}: 25% Chance\nBoth the raid leader and the trainer that deals the most damage will have 1.5x the drop rates!`;
            break;
    }
    return raid_rewards;
}

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

// Function to return random integer
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
    name: "raid",
    aliases: []
}