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
                        if (last_raid_time == undefined || last_raid_time + 10800000 > Date.now()) {
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
                            raid_time_left = new Date(new Date(raid_time_left).getTime() - new Date().getTime());
                            raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                            var embed = new Discord.MessageEmbed();
                            embed.attachFiles(raid_boss_image[1]);
                            embed.setTitle(`${message.author.username} has started a raid battle!`);
                            description = `**RaidID: \n` + `Difficulty: ${raid_type}\n` + `Time Left: ${raid_time_left_string}**`;
                            embed.setDescription(description);
                            embed.addField(`Level ${raid_level} ${raid_boss_name}`, stats_string, false);
                            embed.addField(`Trainers:`, `Trainer #1: ${message.author.tag}\nTrainer #2: None\nTrainer #3: None\nTrainer #4: None`, false);
                            embed.addField(`Obtainable Rewards:`, raid_rewards, false);
                            embed.setImage('attachment://' + raid_boss_image[0] + ".png")
                            embed.setFooter(`To join this raid, do ${prefix}r join id. To start the raid, the raid leader needs to do ${prefix}r start. To duel the raid boss, do ${prefix}r duel.`)
                            
                            // Start server side works.
                            var raid_data = new raid_model({
                                
                            });
                            
                            message.channel.send(embed);
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

// Function to return random integer
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
    name: "raid",
    aliases: []
}