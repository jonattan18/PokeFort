const Discord = require('discord.js');
const _ = require('lodash');
const mergeImages = require('merge-images-v2');
const Canvas = require('canvas');

// Models
const user_model = require('../models/user');
const prompt_model = require('../models/prompt');
const raid_model = require('../models/raids');

// Utils
const getPokemons = require('../utils/getPokemon');
const { floor } = require('lodash');
const movesparser = require('../utils/moveparser');
const pagination = require('../utils/pagination');

// Raid Sim
const { BattleStreams, Teams, Streams } = require('@pkmn/sim');

// Misc
const config = require("../config/config.json");

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    // return message.channel.send("Invalid Command!")

    if ((args.length == 1 && args[0].toLowerCase() == "spawn") || (args.length == 2 && args[0].toLowerCase() == "spawn" && args[1].toLowerCase() == "--g")) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
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
                        if (user.RaidAlphaAgree == undefined || user.RaidAlphaAgree == false) {
                            return message.channel.send(`You have not agreed to the raid agreement. "The raid is under alpha testing stage, and users will more likely encounter flaws. If you encounter any issues, please report them in **bug-report** channel. Thanks for understanding. Use ${prefix}raid agree to agree to the agreement.`);
                        }

                        if (args[1] != undefined && args[1] == "--g") {
                            if (user.WishingPieces != undefined && user.WishingPieces > 0) {
                                user.WishingPieces--;
                                message.channel.send(`You have used a wishing piece to spawn a raid.`);
                            } else return message.channel.send(`You do not have any wishing pieces to spawn this raid.`);
                        }

                        var last_raid_time = user.Raids.SpawnTimestamp;
                        // check if 3 hours passed since last raid spawn.
                        if (last_raid_time == undefined || (new Date().getTime() - last_raid_time) < 10800000) {

                            // Decide raid boss based on random.
                            if (args[1] != undefined && args[1] == "--g") var raid_pokemons = pokemons.filter(it => it["Alternate Form Name"] == "Gigantamax");
                            else var raid_pokemons = pokemons.filter(it => ((it["Legendary Type"] === "Mythical" || it["Primary Ability"] === "Beast Boost" || it["Legendary Type"] === "Legendary" || it["Legendary Type"] === "Sub-Legendary") && (it["Alternate Form Name"] === "Galar" || it["Alternate Form Name"] === "Alola" || it["Alternate Form Name"] === "Hisuian" || it["Alternate Form Name"] === "NULL") && !config.RAID_EXCEPTIONAL_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"])) || config.RAID_INCLUDE_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"]));
                            var raid_boss = raid_pokemons[Math.floor(Math.random() * raid_pokemons.length)];
                            var raid_boss_name = getPokemons.get_pokemon_name_from_id(raid_boss["Pokemon Id"], pokemons, false);

                            // Decide Easy, Normal, Hard, Challenge, Intense based on random.
                            var rand_difficulty = Math.floor(Math.random() * 1000);
                            if (rand_difficulty < 500) difficulty = 0;
                            else if (rand_difficulty < 700) difficulty = 1;
                            else if (rand_difficulty < 850) difficulty = 2;
                            else if (rand_difficulty < 950) difficulty = 3;
                            else difficulty = 4;

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
                            var stats_string = `Health: ${stats[0].toLocaleString()}\nAttack: ${stats[1]}\nDefense: ${stats[2]}\nSpecial Attack: ${stats[3]}\nSpecial Defense: ${stats[4]}\nSpeed: ${stats[5]}`;
                            var raid_boss_image = getPokemons.imagefromid(raid_boss["Pokemon Id"], pokemons, false, true);

                            // Time String
                            var raid_time_left_string = "";
                            var future_timeout = raid_time_left;
                            raid_time_left = new Date(new Date(raid_time_left).getTime() - new Date().getTime());
                            raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                            var embed = new Discord.MessageEmbed();
                            embed.attachFiles(raid_boss_image[1]);
                            embed.setColor(getRaidColor(difficulty));
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
                                Gigantamax: args[1] != undefined && args[1] == "--g" ? true : undefined,
                                Started: false,
                                Timestamp: future_timeout,
                                RaidPokemon: {
                                    ID: raid_boss["Pokemon Id"],
                                    Name: raid_boss_name,
                                    Level: raid_level,
                                    Image: raid_boss_image,
                                    IV: [stats[6][0], stats[6][1], stats[6][2], stats[6][3], stats[6][4], stats[6][5]],
                                    Health: stats[0],
                                    MaxHealth: stats[0],
                                    Attack: stats[1],
                                    Defense: stats[2],
                                    SpAttack: stats[3],
                                    SpDefense: stats[4],
                                    Speed: stats[5],
                                    Weather: {
                                        Name: "Clear Skies"
                                    },
                                },
                                Trainers: [message.author.id],
                                TrainersTag: [message.author.tag],
                                MutedTrainers: user.Raids.Muted != undefined && user.Raids.Muted != false ? [message.author.id] : [],
                            });

                            // Save user data.
                            user.Raids.Spawned[raid_type] = user.Raids.Spawned[raid_type] ? user.Raids.Spawned[raid_type] + 1 : 1;
                            user.Raids.SpawnTimestamp = Date.now();
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
    else if (args.length == 1 && args[0].toLowerCase() == "start") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                if (raid.Trainers[0] != message.author.id) return message.channel.send(`You are not the raid leader.`);
                else {
                    raid.Started = true;
                    raid.save().then(() => {
                        message.channel.send(`You have started the raid.`);

                        // Raid started announcement.
                        for (var i = 0; i < raid.Trainers.length; i++) {
                            if (raid.Trainers[i]) {
                                if (!raid.MutedTrainers.includes(raid.Trainers[i])) bot.users.cache.get(raid.Trainers[i]).send(`The ${raid.RaidPokemon.Name} raid has started. Do ${prefix}r duel to duel the raid boss.`);
                            }
                        }
                    });
                }
            }
            else return message.channel.send(`You are not in a raid.`);
        });
    }
    else if (args.length == 2 && args[0].toLowerCase() == "join" && digits_only(args[1])) {

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return message.channel.send("You can't raid while you are in a trade!");

            prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
                if (err) return console.log(err);
                if (_duel) return message.channel.send("You can't raid while you are in a duel!");

                // User check if raid scheme has trainer included.
                raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
                    if (err) { console.log(err); return; }
                    if (raid) {
                        message.channel.send(`You are already in a raid.`);
                        return;
                    }
                    else {
                        raid_model.findOne({ $and: [{ RaidID: parseInt(args[1]) }, { Timestamp: { $gt: Date.now() } }] }, (err, raid_data) => {
                            if (err) { console.log(err); return; }
                            if (!raid_data) return message.channel.send(`No raid found with that ID.`);
                            else {
                                if (raid_data.Started) return message.channel.send(`Raid has already started.`);
                                else {
                                    if (raid_data.Ban != undefined && raid_data.Ban.includes(message.author.id)) return message.channel.send(`Sorry, You can't enter this raid.`);
                                    if (raid_data.Trainers.length == 4) return message.channel.send(`The specified raid already has 4 trainers.`);
                                    else {
                                        user_model.findOne({ UserID: message.author.id }, (err, user) => {
                                            if (err) { console.log(err); return; }
                                            if (user) {
                                                user.Raids.Joined = user.Raids.Joined != undefined ? user.Raids.Joined + 1 : 1;
                                                raid_data.Trainers.push(message.author.id);
                                                raid_data.TrainersTag.push(message.author.tag);
                                                if (user.Raids.Muted != undefined && user.Raids.Muted != false) raid_data.MutedTrainers.push(message.author.id);
                                                raid_data.save().then(() => {
                                                    user.save().then(() => {
                                                        // Stats String
                                                        var stats_string = `Health: ${raid_data.RaidPokemon.Health.toLocaleString()}\nAttack: ${raid_data.RaidPokemon.Attack}\nDefense: ${raid_data.RaidPokemon.Defense}\nSpecial Attack: ${raid_data.RaidPokemon.SpAttack}\nSpecial Defense: ${raid_data.RaidPokemon.SpDefense}\nSpeed: ${raid_data.RaidPokemon.Speed}`;
                                                        var raid_boss_image = getPokemons.imagefromid(raid_data.RaidPokemon.ID.toString(), pokemons, false, true);

                                                        // Time String
                                                        var raid_time_left_string = "";
                                                        raid_time_left = new Date(new Date(raid_data.Timestamp).getTime() - new Date().getTime());
                                                        raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                                                        var embed = new Discord.MessageEmbed();
                                                        embed.attachFiles(raid_boss_image[1]);
                                                        embed.setColor(getRaidColor(raid_data.RaidType));
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
            });
        });
    }
    else if (args.length == 1 && (args[0].toLowerCase() == "info" || args[0].toLowerCase() == "i" || args[0].toLowerCase() == "view")) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid_data) => {
            if (err) { console.log(err); return; }
            if (raid_data) {
                // Stats String
                var stats_string = `Health: ${raid_data.RaidPokemon.Health.toLocaleString()}\nAttack: ${raid_data.RaidPokemon.Attack}\nDefense: ${raid_data.RaidPokemon.Defense}\nSpecial Attack: ${raid_data.RaidPokemon.SpAttack}\nSpecial Defense: ${raid_data.RaidPokemon.SpDefense}\nSpeed: ${raid_data.RaidPokemon.Speed}`;
                var raid_boss_image = getPokemons.imagefromid(raid_data.RaidPokemon.ID.toString(), pokemons, false, true);

                // Time String
                var raid_time_left_string = "";
                raid_time_left = new Date(new Date(raid_data.Timestamp).getTime() - new Date().getTime());
                raid_time_left_string = `${raid_time_left.getUTCHours()}:${raid_time_left.getUTCMinutes()}:${raid_time_left.getUTCSeconds()}`;

                var embed = new Discord.MessageEmbed();
                embed.attachFiles(raid_boss_image[1]);
                if (raid_data.Started) embed.setTitle(`Raid Has Started!`);
                else embed.setTitle(`Raid Has Not Started!`);
                embed.setColor(getRaidColor(raid_data.RaidType));
                embed.addField(`Level ${raid_data.RaidPokemon.Level} ${raid_data.RaidPokemon.Name}`, stats_string, false);

                var trainer_data = "";
                for (var i = 0; i < 4; i++) {
                    trainer_data += `Trainer #${i + 1}: ${raid_data.TrainersTag[i] != undefined ? raid_data.TrainersTag[i] : "None"}`
                    if (raid_data.CompletedDuel != undefined && raid_data.CompletedDuel.includes(raid_data.Trainers[i])) trainer_data += " :white_check_mark:\n";
                    else if (raid_data.CurrentDuel != undefined && raid_data.CurrentDuel == raid_data.Trainers[i]) trainer_data += " -> Currently Attacking\n";
                    else trainer_data += "\n";
                }

                embed.addField(`Trainers:`, trainer_data, false);
                embed.addField(`Obtainable Rewards:`, getRewards(raid_data.RaidType, raid_data.RaidPokemon.Name), false);
                embed.setImage('attachment://' + raid_boss_image[0] + ".png")
                description = `**${raid_data.Started ? `HP: ${raid_data.RaidPokemon.Health.toLocaleString()}/${raid_data.RaidPokemon.MaxHealth.toLocaleString()}\n` : ``}RaidID: ${raid_data.RaidID}\n` + `Difficulty: ${getDifficultyString(raid_data.RaidType)}\n` + `Time Left: ${raid_time_left_string}**`;
                embed.setDescription(description);
                embed.setFooter(`To join this raid, do ${prefix}r join ${raid_data.RaidID}. To start the raid, the raid leader needs to do ${prefix}r start. To duel the raid boss, do ${prefix}r duel.`)
                message.channel.send(embed);
            }
            else return message.channel.send(`You are not in a raid.`);
        });
    }
    else if (args.length == 2 && args[0].toLowerCase() == "kick" && isInt(args[1])) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                if (raid.Trainers[0] != message.author.id) return message.channel.send(`You are not the raid leader.`);
                if (raid.Trainers[args[1] - 1] == message.author.id) return message.channel.send(`You can't kick yourself.`);
                if (raid.Trainers[args[1] - 1] == undefined) return message.channel.send(`No trainer found at that number.`);

                raid.Trainers.splice(args[1] - 1, 1);
                var kicked_user = raid.TrainersTag.splice(args[1] - 1, 1);
                raid.save().then(() => {
                    message.channel.send(`You have kicked \`${kicked_user}\` from the raid.`);
                });

            } else return message.channel.send(`You are not in a raid.`);
        });
    }
    else if (args.length == 2 && args[0].toLowerCase() == "ban" && isInt(args[1])) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                if (raid.Trainers[0] != message.author.id) return message.channel.send(`You are not the raid leader.`);
                if (raid.Trainers[args[1] - 1] == message.author.id) return message.channel.send(`You can't ban yourself.`);
                if (raid.Trainers[args[1] - 1] == undefined) return message.channel.send(`No trainer found at that number.`);

                raid.Ban.push(raid.Trainers[args[1] - 1]);
                raid.Trainers.splice(args[1] - 1, 1);
                var banned_user = raid.TrainersTag.splice(args[1] - 1, 1);
                raid.save().then(() => {
                    message.channel.send(`You have banned \`${banned_user}\` from the raid.`);
                });

            } else return message.channel.send(`You are not in a raid.`);
        });
    }
    else if (args.length == 1 && (args[0].toLowerCase() == "leave" || args[0].toLowerCase() == "l")) {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                // Get user data.
                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                    if (err) { console.log(err); return; }
                    if (user) {
                        user.Raids.Left = user.Raids.Left != undefined ? user.Raids.Left + 1 : 1;
                        var remove_index = raid.Trainers.indexOf(message.author.id);
                        raid.Trainers.splice(remove_index, 1);
                        raid.TrainersTag.splice(remove_index, 1);
                        raid.CurrentDuel = undefined;
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
    else if (args.length == 1 && args[0].toLowerCase() == "mute") {
        // User check if raid is already muted.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) { console.log(err); return; }
            if (user) {
                if (user.Raids.Muted) return message.channel.send(`You already muted the raid messages.`);
                user.Raids.Muted = true;
                user.save().then(() => {
                    message.channel.send(`You have muted the raid messages.`);
                });
            }
        });
    }
    else if (args.length == 1 && args[0].toLowerCase() == "unmute") {
        // User check if raid is already unmuted.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) { console.log(err); return; }
            if (user) {
                if (!user.Raids.Muted) return message.channel.send(`You are not muted the raid messages.`);
                user.Raids.Muted = false;
                user.save().then(() => {
                    message.channel.send(`You have unmuted the raid messages.`);
                });
            }
        });
    }
    else if (args.length == 1 && args[0].toLowerCase() == "duel") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: message.author.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) { console.log(err); return; }
            if (raid) {
                user_model.findOne({ UserID: message.author.id }, (err, user) => {
                    var team = user.Teams.filter(team => team.Selected == true)[0];
                    if (team == undefined) return message.channel.send(`You should select a team or create a team to enter a raid duel!`);
                    if (!raid.Started) return message.channel.send("This raid has not started yet!");
                    if (raid.CurrentDuel != undefined && raid.CurrentDuel == message.author.id) return message.channel.send("You are already in duel with this raid boss!");
                    if (raid.CompletedDuel.includes(message.author.id)) return message.channel.send("You have already completed this raid duel!");
                    if (raid.CurrentDuel != undefined) return message.channel.send("A user is already dueling this raid boss!");
                    if (team.Pokemons.isNull()) return message.channel.send("Your team should not be empty.");

                    // Get pokemons details
                    getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                        // Transfer team pokemons to trainers data.
                        var trainer_data = transferTeamData(team, user_pokemons, pokemons);

                        var raid_moveset = movesparser.get_raid_moves_from_id(raid.RaidPokemon.ID, pokemons);
                        var raidmoves_to_stream = [];
                        for (i = 0; i < raid_moveset.length; i++) {
                            raidmoves_to_stream.push(raid_moveset[i][0]);
                        }

                        // Team Packing
                        var packed_team_1 = Teams.pack(trainer_data);
                        var packed_team_2 = Teams.pack([{
                            name: raid.RaidPokemon.Name + "_r",
                            species: raid.RaidPokemon.Name,
                            level: raid.RaidPokemon.Level,
                            gender: '',
                            shiny: false,
                            gigantamax: false,
                            moves: raidmoves_to_stream,
                            ability: "",
                            evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
                            ivs: { hp: raid.RaidPokemon.IV[0], atk: raid.RaidPokemon.IV[1], def: raid.RaidPokemon.IV[2], spa: raid.RaidPokemon.IV[3], spd: raid.RaidPokemon.IV[4], spe: raid.RaidPokemon.IV[5] },
                        }]);

                        // Get image url of user team pokemon.
                        var user_pokemon_data = trainer_data.filter(pokemon => pokemon != null)[0];
                        var user_image_data = user_pokemon_data.Image;
                        var current_pokemon = trainer_data.indexOf(user_pokemon_data);

                        var _battleStream = new BattleStreams.BattleStream();
                        const streams = BattleStreams.getPlayerStreams(_battleStream);
                        const spec = { formatid: 'customgame' };

                        const p1spec = { name: '$Player1', team: packed_team_1.replaceAll("]undefined|||-||||||||", "") };
                        const p2spec = { name: '$Player2', team: packed_team_2 };

                        // Packing raid data.
                        raid.CurrentDuel = message.author.id;
                        raid.TrainersTeam = trainer_data;
                        raid.CurrentPokemon = current_pokemon;
                        raid.CurrentTurn = 0;

                        // Start raid duel.
                        var write_data = `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1spec)}\n>player p2 ${JSON.stringify(p2spec)}\n>p1 team 123\n>p2 team 1`;
                        void streams.omniscient.write(write_data);

                        void (async () => {
                            for await (var chunk of streams.omniscient) {
                                var received_data = chunk.split('\n');
                                if (received_data.includes("|start")) {
                                    raid.Stream = _battleStream.battle.inputLog.join('\n');
                                    raid.UserStreamPokemons = JSON.stringify(_battleStream.battle.sides[0].pokemon);
                                    raid.save().then(() => {
                                        // Get image url of raid boss.
                                        var raid_boss_image_data = raid.RaidPokemon.Image;

                                        var raidside = null;
                                        if (raid.RaidPokemon.RaidStream != undefined && raid.RaidPokemon.RaidStream.raidside != undefined) {
                                            _battleStream.battle.field = JSON.parse(raid.RaidPokemon.RaidStream.field);
                                            raidside = JSON.parse(raid.RaidPokemon.RaidStream.raidside);
                                        } else raidside = _battleStream.battle.sides[1];

                                        // Background image url.
                                        var image_url = "./assets/raid_images/background.jpeg";
                                        if (_battleStream.battle.field.weather == "hail") image_url = "./assets/raid_images/background-hail.jpeg";
                                        else if (_battleStream.battle.field.weather == "sunny") image_url = "./assets/raid_images/background-sunny.jpeg";
                                        else if (_battleStream.battle.field.weather == "rain") image_url = "./assets/raid_images/background-rain.jpeg";
                                        else if (_battleStream.battle.field.weather == "sandstorm") image_url = "./assets/raid_images/background-sandstorm.jpeg";

                                        // Creating Image for embed.
                                        mergeImages([image_url,
                                            { src: user_image_data[1], x: 80, y: 180, width: 200, height: 200 }, { src: raid_boss_image_data[1], x: 430, y: 20, width: 360, height: 360 }], {
                                            Canvas: Canvas
                                        }).then(b64 => {
                                            const img_data = b64.split(',')[1];
                                            const img_buffer = new Buffer.from(img_data, 'base64');
                                            const image_file = new Discord.MessageAttachment(img_buffer, 'img.jpeg');

                                            // Sending duel message.
                                            var embed = new Discord.MessageEmbed();
                                            embed.setTitle(`${message.author.username.toUpperCase()} VS Raid Boss!`);
                                            embed.setDescription(`**Weather: ${_battleStream.battle.field.weather == "" ? "Clear Skies" : _.capitalize(_battleStream.battle.field.weather)}**${_battleStream.battle.field.terrain == "" ? "" : "\n**Terrain: " + _.capitalize(_battleStream.battle.field.terrain + "**")}`);
                                            embed.addField(`${message.author.username}'s Pokémon`, `${user_pokemon_data.name.replaceAll("_r", "").slice(0, -2)} | ${user_pokemon_data.max_hp}/${user_pokemon_data.max_hp}HP`, true);
                                            embed.addField(`Raid Boss`, `${raid.RaidPokemon.Name.replaceAll("_r", "")} | ${raidside.pokemon[0].hp}/${raidside.pokemon[0].maxhp}HP`, true);
                                            embed.setColor(message.guild.me.displayHexColor);
                                            embed.attachFiles(image_file)
                                            embed.setImage('attachment://img.jpeg');
                                            embed.setFooter(`Use ${prefix}team to see the current state of your team as well as what moves your pokémon has available to them!`);
                                            message.channel.send(embed);

                                            // Get user data.
                                            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                                                if (err) return;
                                                if (user) {
                                                    user.Raids.TotalDuels = user.Raids.TotalDuels ? user.Raids.TotalDuels + 1 : 1;
                                                }
                                            });
                                        });
                                    });
                                } else {
                                    return message.channel.send(`Something went wrong, we could not start the raid duel.`);
                                }
                            }
                        })();
                    });
                });
            }
            else return message.channel.send(`You are not in a raid.`);
        });
    }
    // Remove me
    else if (args.length == 1 && args[0].toLowerCase() == "agree") {

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) return;
            if (!user) return;

            if (user.RaidAlphaAgree == true) return message.channel.send(`You have already agreed to the raid terms.`);
            else {
                user.RaidAlphaAgree = true;
                user.save().then(() => {
                    return message.channel.send(`You have agreed to the raid terms. Have fun exploring raid features.`);
                });
            }

        });

    }
    else if (args.length == 1 && args[0].toLowerCase() == "profile" || args[0].toLowerCase() == "pf") {

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) return;
            if (!user) return;

            var footer_string = "";
            var last_raid_time = user.Raids.SpawnTimestamp;

            if (last_raid_time == undefined || (new Date().getTime() - last_raid_time) > 10800000) {
                footer_string = `Use ${prefix}raid spawn to spawn a raid.`;
            } else {
                // Get time left until next raid spawn in hh:mm:ss format.
                var time_left = new Date(last_raid_time + 10800000 - Date.now());
                footer_string = "Time left to be able to spawn a raid: " + time_left.getUTCHours() + ":" + time_left.getUTCMinutes() + ":" + time_left.getUTCSeconds();
            }

            var user_raid = user.Raids;
            var easy = user_raid.Completed.Easy ? user_raid.Completed.Easy : 0;
            var normal = user_raid.Completed.Normal ? user_raid.Completed.Normal : 0;
            var hard = user_raid.Completed.Hard ? user_raid.Completed.Hard : 0;
            var challenge = user_raid.Completed.Challenge ? user_raid.Completed.Challenge : 0;
            var intense = user_raid.Completed.Intense ? user_raid.Completed.Intense : 0;
            var gmax = user_raid.Completed.Gigantamax ? user_raid.Completed.Gigantamax : 0;
            var total_raids_completed = easy + normal + hard + challenge + intense + gmax;

            var embed = new Discord.MessageEmbed();
            embed.setTitle(`${message.author.username}'s Raid Profile`);
            embed.setColor(message.author.displayHexColor);
            embed.setThumbnail(message.author.avatarURL());
            embed.setDescription(`**Total Raids Completed:** ${total_raids_completed}`
                + `\n**Easy Raids Completed:** ${easy}`
                + `\n**Normal Raids Completed:** ${normal}`
                + `\n**Hard Raids Completed:** ${hard}`
                + `\n**Challenge Raids Completed:** ${challenge}`
                + `\n**Intense Raids Completed:** ${intense}`
                + `\n**Gigantamax Raids Completed:** ${gmax}`
                + `\n**Total Damage Dealt To Raid Bosses:** ${user_raid.TotalDamage ? user_raid.TotalDamage.toLocaleString() : 0}`);
            embed.setFooter(footer_string);
            message.channel.send(embed);
        });
    }
    else if (args[0].toLowerCase() == "dex" || args[0].toLowerCase() == "eventdex") {

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) return;
            if (!user) return;

            if (args[0].toLowerCase() == "dex") var raid_pokemons = pokemons.filter(it => ((it["Legendary Type"] === "Mythical" || it["Primary Ability"] === "Beast Boost" || it["Legendary Type"] === "Legendary" || it["Legendary Type"] === "Sub-Legendary") && (it["Alternate Form Name"] === "Galar" || it["Alternate Form Name"] === "Alola" || it["Alternate Form Name"] === "Hisuian" || it["Alternate Form Name"] === "NULL") && !config.RAID_EXCEPTIONAL_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"])) || config.RAID_INCLUDE_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"]));
            else if (args[0].toLowerCase() == "eventdex") var raid_pokemons = pokemons.filter(it => it["Alternate Form Name"] == "Gigantamax");

            // Remove dex or eventdex from args.
            args.shift();

            for (var i = 0; i < raid_pokemons.length; i++) {
                var dex_data = user.Raids.RaidDex.filter(it => it.PokemonId == raid_pokemons[i]["Pokemon Id"]);
                raid_pokemons[i].fullname = getPokemons.get_pokemon_name_from_id(raid_pokemons[i]["Pokemon Id"], pokemons);

                dex_data = dex_data.length > 0 ? dex_data[0] : { Completed: {} };
                raid_pokemons[i].easy = dex_data.Completed.Easy ? dex_data.Completed.Easy : 0;
                raid_pokemons[i].normal = dex_data.Completed.Normal ? dex_data.Completed.Normal : 0;
                raid_pokemons[i].hard = dex_data.Completed.Hard ? dex_data.Completed.Hard : 0;
                raid_pokemons[i].challenge = dex_data.Completed.Challenge ? dex_data.Completed.Challenge : 0;
                raid_pokemons[i].intense = dex_data.Completed.Intense ? dex_data.Completed.Intense : 0;
                raid_pokemons[i].totaldefeated = raid_pokemons[i].easy + raid_pokemons[i].normal + raid_pokemons[i].hard + raid_pokemons[i].challenge + raid_pokemons[i].intense
            }

            // Filter by user.
            if (args.length == 0) return create_pagination(message, "Your raid dex", 0, raid_pokemons);
            else if (args.length == 1 && args[0] == "--uncompleted") {
                raid_pokemons = raid_pokemons.filter(it => it.totaldefeated == 0);
                return create_pagination(message, "Your uncompleted raids", 0, raid_pokemons);
            }
            else if (args.length == 1 && args[0] == "--completed") {
                raid_pokemons = raid_pokemons.filter(it => it.totaldefeated > 0);
                return create_pagination(message, "Your completed raids", 0, raid_pokemons);
            }
            else if (args.length > 1 && (args[0] == "--n" || args[0] == "--name")) {
                args.shift();
                var name = args.join(" ");
                raid_pokemons = raid_pokemons.filter(it => it.fullname.toLowerCase().replace(":", "").includes(name.toLowerCase().replace(":", " ")));
                if (raid_pokemons.length == 0) return message.channel.send("Unable to find any raid pokemon with that name.");
                return create_pagination(message, "Your raids", 0, raid_pokemons);
            }
            else return message.channel.send("Invalid arguments.");

        });
    }
    else return message.channel.send("Invalid syntax.");
}

// Function to create pagination for dex.
function create_pagination(message, title = "Raid Dex", page = 0, raid_pokemons) {
    if (raid_pokemons == undefined || raid_pokemons == null || !raid_pokemons || raid_pokemons.length == 0) return message.channel.send("No data found.");

    var total_defeated_pokemons = raid_pokemons.filter(it => it.totaldefeated > 0);
    var description = `You have defeated ${total_defeated_pokemons.length}/${raid_pokemons.length} raid bosses!`;

    var temp_counter = 0;
    var tot_len = raid_pokemons.length;
    var split_chunks = spliceIntoChunks(raid_pokemons, 20);
    var embeds = [];
    var current_index = 0;
    for (i = 0; i < split_chunks.length; i++) {
        embeds[i] = new Discord.MessageEmbed();
        embeds[i].setTitle(title);
        temp_counter += split_chunks[i].length;
        for (j = 0; j < split_chunks[i].length; j++) {
            current_index = temp_counter - split_chunks[i].length + 1;
            var raid_field_data = `Total time beaten: ${split_chunks[i][j].totaldefeated}`
                + `\nEasy: ${split_chunks[i][j].easy}`
                + `\nNormal: ${split_chunks[i][j].normal}`
                + `\nHard: ${split_chunks[i][j].hard}`
                + `\nChallenge: ${split_chunks[i][j].challenge}`
                + `\nIntense: ${split_chunks[i][j].intense}`;
            embeds[i].addField(split_chunks[i][j].fullname, raid_field_data);
        }
        embeds[i].setDescription(description);
        embeds[i].setFooter(`Page: ${i + 1}/${split_chunks.length} Showing ${current_index} to ${(current_index - 1) + split_chunks[i].length} out of ${tot_len}`);
    }
    message.channel.send(embeds[page]).then(msg => {
        if (split_chunks.length > 1) return pagination.createpage(message.channel.id, message.author.id, msg.id, embeds, 0);
        else return;
    });
}

// Transfer team data to trainers data.
function transferTeamData(team_data, user_pokemons, pokemons) {
    var trainersteam = [];
    for (i = 0; i < team_data.Pokemons.length; i++) {

        // First step check if data is null.
        if (team_data["Pokemons"][i] == null) trainersteam.push({});

        // Second step check if user still have that pokemon.
        else {
            var pokemon_from_db = user_pokemons.filter(it => it._id == team_data["Pokemons"][i])[0];
            if (pokemon_from_db == undefined) trainersteam.push({});

            // Third step add pokemon to trainer team.
            else {
                var move_data = [];
                for (var j = 0; j < 4; j++) {
                    if (pokemon_from_db.Moves != undefined && pokemon_from_db.Moves[j + 1] != undefined) {
                        var move_name = pokemon_from_db.Moves[j + 1].replace(" (TM)", "");
                        move_data.push(move_name);
                    } else move_data.push(`Tackle`)
                }

                // Add stats to the pokemons.
                var nature_name = nature_of(pokemon_from_db.Nature)[0];

                // Get image url.
                var image = getPokemons.imagefromid(pokemon_from_db.PokemonId, pokemons, pokemon_from_db.Shiny, true);

                // Pokemon Health Stat.
                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_from_db.PokemonId)[0];
                var hp = pokemon_db["Health Stat"];
                var type = [pokemon_db["Primary Type"], pokemon_db["Secondary Type"]];

                var data_to_add = {
                    name: getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, false) + "_r_" + (i + 1),
                    species: getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, false),
                    gender: "",
                    shiny: pokemon_from_db.Shiny,
                    gigantamax: false,
                    level: pokemon_from_db.Level,
                    ivs: { hp: pokemon_from_db.IV[0], atk: pokemon_from_db.IV[1], def: pokemon_from_db.IV[2], spa: pokemon_from_db.IV[3], spd: pokemon_from_db.IV[4], spe: pokemon_from_db.IV[5] },
                    Image: image,
                    ability: "",
                    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
                    nature: nature_name,
                    moves: move_data,
                    fainted: false,
                    selected: false,
                    max_hp: floor(0.01 * (2 * hp + pokemon_from_db.IV[0] + floor(0.25 * 0)) * pokemon_from_db.Level) + pokemon_from_db.Level + 10,
                    type: type
                }
                trainersteam.push(data_to_add);
            }
        }
    }
    return trainersteam;
}

// Decide raid stats calculation formula.
function getRaidStats(base_stat, raid_level, difficulty) {
    var IV = [Math.floor(Math.random() * 31)];
    var raid_stats = [];
    raid_stats.push(floor(floor(0.01 * (2 * base_stat[0] + IV[0]) * raid_level) + raid_level * 10 * 2.31 * 2.11));

    switch (difficulty) {
        // Easy
        case 0:
            for (var i = 1; i < 6; i++) {
                var iv = Math.floor(Math.random() * 31);
                IV.push(iv);
                raid_stats.push(floor(floor(0.01 * (2 * base_stat[i] + iv) * raid_level) / 1.81));
            }
            break;
        // Normal
        case 1:
            for (var i = 1; i < 6; i++) {
                var iv = Math.floor(Math.random() * 31);
                IV.push(iv);
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + iv) * raid_level) / 2.22) / 2.12));
            }
            break;
        // Hard
        case 2:
            for (var i = 1; i < 6; i++) {
                var iv = Math.floor(Math.random() * 31);
                IV.push(iv);
                raid_stats.push(floor(floor(0.01 * (2 * base_stat[i] + iv) * raid_level) / 3.2 / 3.2) + 20);
            }
            break;
        // Challenge
        case 3:
            for (var i = 1; i < 6; i++) {
                var iv = Math.floor(Math.random() * 31);
                IV.push(iv);
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + iv) * raid_level) / 4) / 3.3));
            }
            break;
        // Intense
        case 4:
            for (var i = 1; i < 6; i++) {
                var iv = Math.floor(Math.random() * 31);
                IV.push(iv);
                raid_stats.push(floor((floor(0.01 * (2 * base_stat[i] + iv) * raid_level) / 5.2) / 3) + Math.floor(Math.random() * 30));
            }
            break;
    }
    raid_stats.push(IV);
    return raid_stats;
}

// Prototype to check if array is only null.
Array.prototype.isNull = function () {
    return this.join().replace(/,/g, '').length === 0;
};

// Digits only check.
const digits_only = string => [...string].every(c => '0123456789'.includes(c));

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

// Function to get raid color.
function getRaidColor(difficulty) {
    switch (difficulty) {
        case 0:
            return "#00ff00";
        case 1:
            return "#0000ff";
        case 2:
            return "#ff0000";
        case 3:
            return "#800080";
        case 4:
            return "#ffd900";
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

// Function to chunk given data.
function spliceIntoChunks(arr, chunkSize) {
    const res = [];
    while (arr.length > 0) {
        const chunk = arr.splice(0, chunkSize);
        res.push(chunk);
    }
    return res;
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