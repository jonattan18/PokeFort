const Discord = require('discord.js');
const _ = require('lodash');
const sharp = require('sharp');

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
const { BattleStreams, Teams } = require('@pkmn/sim');

// Misc
const config = require("../config/config.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (interaction.options.getSubcommand() === "spawn") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) return interaction.reply({ content: `You are already in a raid.`, ephemeral: true });
            else {
                // Get user data.
                user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                    if (err) return console.log(err);
                    if (user) {

                        if (interaction.options.get("gmax") != null) {
                            if (user.WishingPieces != undefined && user.WishingPieces > 0) user.WishingPieces--;
                            else return interaction.reply({ content: `You do not have any wishing pieces to spawn this raid.`, ephemeral: true });
                        }

                        var last_raid_time = user.Raids.SpawnTimestamp;
                        // check if 3 hours passed since last raid spawn.
                        if (interaction.options.get("gmax") != null || last_raid_time == undefined || (new Date().getTime() - last_raid_time) > 1800000 || (user.Admin != undefined && user.Admin > 3) || (user.NoCooldownRaid != undefined && user.NoCooldownRaid == true)) {

                            // Remove me on release...
                            if (user.NoCooldownRaid != undefined && user.NoCooldownRaid == true) {
                                user_model.updateOne({ UserID: interaction.user.id }, { $set: { NoCooldownRaid: undefined } }, (err, user) => {
                                    if (err) return console.log(err);
                                });
                            }

                            // Decide raid boss based on random.
                            if (interaction.options.get("gmax") != null) var raid_pokemons = pokemons.filter(it => it["Alternate Form Name"] == "Gigantamax" && !config.RAID_EXCEPTIONAL_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"]));
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
                            raid_time_left_string = `${raid_time_left.getUTCHours().toString().padStart(2, "0")}:${raid_time_left.getUTCMinutes().toString().padStart(2, "0")}:${raid_time_left.getUTCSeconds().toString().padStart(2, "0")}`;

                            var embed = new Discord.EmbedBuilder();
                            embed.setColor(getRaidColor(difficulty));
                            embed.setTitle(`${interaction.user.username} has started a raid battle!`);
                            embed.addFields({ name: `Level ${raid_level} ${raid_boss_name}`, value: stats_string, inline: false });
                            embed.addFields({ name: `Trainers:`, value: `Trainer #1: ${interaction.user.tag}\nTrainer #2: None\nTrainer #3: None\nTrainer #4: None`, inline: false });
                            embed.addFields({ name: `Obtainable Rewards:`, value: raid_rewards, inline: false });
                            embed.setImage('attachment://' + raid_boss_image[0] + ".png")

                            var unique = String(new Date().valueOf()).substring(3, 13);

                            description = `**RaidID: ${unique}\n` + `Difficulty: ${raid_type}\n` + `Time Left: ${raid_time_left_string}**`;
                            embed.setDescription(description);
                            embed.setFooter({ text: `To join this raid, do /r join ${unique}. To start the raid, the raid leader needs to do /r start. To duel the raid boss, do /r duel.` })

                            // Start server side works.
                            raid_data = new raid_model({
                                RaidID: unique,
                                RaidType: difficulty,
                                Gigantamax: interaction.options.get("gmax") != null ? true : undefined,
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
                                Trainers: [interaction.user.id],
                                TrainersTag: [interaction.user.tag],
                                MutedTrainers: user.Raids.Muted != undefined && user.Raids.Muted != false ? [interaction.user.id] : [],
                            });

                            // Save user data.
                            user.Raids.Spawned[raid_type] = user.Raids.Spawned[raid_type] ? user.Raids.Spawned[raid_type] + 1 : 1;
                            user.Raids.SpawnTimestamp = Date.now();
                            raid_data.save().then(() => {
                                user.save().then(() => {
                                    interaction.reply({ embeds: [embed], files: [raid_boss_image[1]] });
                                });
                            });
                        }
                        else {
                            // Get time left until next raid spawn in hh:mm:ss format.
                            var time_left = new Date(last_raid_time + 1800000 - Date.now());
                            var time_left_string = time_left.getUTCHours().toString().padStart(2, "0") + ":" + time_left.getUTCMinutes().toString().padStart(2, "0") + ":" + time_left.getUTCSeconds().toString().padStart(2, "0");
                            return interaction.reply({ content: `Time left to be able to spawn a raid: ${time_left_string}`, ephemeral: true });
                        }
                    }
                });
            }
        });
    }
    else if (interaction.options.getSubcommand() === "start") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                if (raid.Trainers[0] != interaction.user.id) return interaction.reply({ content: `You are not the raid leader.`, ephemeral: true });
                else {
                    raid.Started = true;
                    raid.save().then(() => {
                        interaction.reply({ content: `You have started the raid.` });

                        // Raid started announcement.
                        for (var i = 0; i < raid.Trainers.length; i++) {
                            if (raid.Trainers[i]) {
                                if (!raid.MutedTrainers.includes(raid.Trainers[i])) bot.users.cache.get(raid.Trainers[i]).send(`The ${raid.RaidPokemon.Name} raid has started. Do /r duel to duel the raid boss.`);
                            }
                        }
                    });
                }
            }
            else return interaction.reply({ content: `You are not in a raid.`, ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "join") {

        prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Trade.Accepted": true }] }, (err, _trade) => {
            if (err) return console.log(err);
            if (_trade) return interaction.reply({ content: "You can't raid while you are in a trade!", ephemeral: true });

            prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
                if (err) return console.log(err);
                if (_duel) return interaction.reply({ content: "You can't raid while you are in a duel!", ephemeral: true });

                // User check if raid scheme has trainer included.
                raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
                    if (err) return console.log(err);
                    if (raid) {
                        interaction.reply({ content: `You are already in a raid.`, ephemeral: true });
                        return;
                    }
                    else {
                        raid_model.findOne({ $and: [{ RaidID: parseInt(interaction.options.get("id").value) }, { Timestamp: { $gt: Date.now() } }] }, (err, raid_data) => {
                            if (err) return console.log(err);
                            if (!raid_data) return interaction.reply({ content: `No raid found with that ID.`, ephemeral: true });
                            else {
                                if (raid_data.Started) return interaction.reply({ content: `Raid has already started.`, ephemeral: true });
                                else {
                                    if (raid_data.Ban != undefined && raid_data.Ban.includes(interaction.user.id)) return interaction.reply({ content: `Sorry, You can't enter this raid.`, ephemeral: true });
                                    if (raid_data.Trainers.length == 4) return interaction.reply({ content: `The specified raid already has 4 trainers.`, ephemeral: true });
                                    else {
                                        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                                            if (err) return console.log(err);
                                            if (user) {
                                                user.Raids.Joined = user.Raids.Joined != undefined ? user.Raids.Joined + 1 : 1;
                                                raid_data.Trainers.push(interaction.user.id);
                                                raid_data.TrainersTag.push(interaction.user.tag);
                                                if (user.Raids.Muted != undefined && user.Raids.Muted != false) raid_data.MutedTrainers.push(interaction.user.id);
                                                raid_data.save().then(() => {
                                                    user.save().then(() => {
                                                        // Stats String
                                                        var stats_string = `Health: ${raid_data.RaidPokemon.Health.toLocaleString()}\nAttack: ${raid_data.RaidPokemon.Attack}\nDefense: ${raid_data.RaidPokemon.Defense}\nSpecial Attack: ${raid_data.RaidPokemon.SpAttack}\nSpecial Defense: ${raid_data.RaidPokemon.SpDefense}\nSpeed: ${raid_data.RaidPokemon.Speed}`;
                                                        var raid_boss_image = getPokemons.imagefromid(raid_data.RaidPokemon.ID.toString(), pokemons, false, true);

                                                        // Time String
                                                        var raid_time_left_string = "";
                                                        raid_time_left = new Date(new Date(raid_data.Timestamp).getTime() - new Date().getTime());
                                                        raid_time_left_string = `${raid_time_left.getUTCHours().toString().padStart(2, "0")}:${raid_time_left.getUTCMinutes().toString().padStart(2, "0")}:${raid_time_left.getUTCSeconds().toString().padStart(2, "0")}`;

                                                        var embed = new Discord.EmbedBuilder();
                                                        embed.setColor(getRaidColor(raid_data.RaidType));
                                                        embed.setTitle(`${interaction.user.username} has joined a raid battle!`);
                                                        embed.addFields({ name: `Level ${raid_data.RaidPokemon.Level} ${raid_data.RaidPokemon.Name}`, value: stats_string, inline: false });

                                                        var trainer_data = "";
                                                        for (var i = 0; i < 4; i++) {
                                                            trainer_data += `Trainer #${i + 1}: ${raid_data.TrainersTag[i] != undefined ? raid_data.TrainersTag[i] : "None"}\n`
                                                        }

                                                        embed.addFields({ name: `Trainers:`, value: trainer_data, inline: false });
                                                        embed.addFields({ name: `Obtainable Rewards:`, value: getRewards(raid_data.RaidType, raid_data.RaidPokemon.Name), inline: false });
                                                        embed.setImage('attachment://' + raid_boss_image[0] + ".png")
                                                        description = `**RaidID: ${raid_data.RaidID}\n` + `Difficulty: ${getDifficultyString(raid_data.RaidType)}\n` + `Time Left: ${raid_time_left_string}**`;
                                                        embed.setDescription(description);
                                                        embed.setFooter({ text: `To join this raid, do /r join ${raid_data.RaidID}. To start the raid, the raid leader needs to do /r start. To duel the raid boss, do /r duel.` });
                                                        interaction.reply({ embeds: [embed], files: [raid_boss_image[1]] });
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
    else if (interaction.options.getSubcommand() === "info") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid_data) => {
            if (err) return console.log(err);
            if (raid_data) {
                // Stats String
                var stats_string = `Health: ${raid_data.RaidPokemon.Health.toLocaleString()}\nAttack: ${raid_data.RaidPokemon.Attack}\nDefense: ${raid_data.RaidPokemon.Defense}\nSpecial Attack: ${raid_data.RaidPokemon.SpAttack}\nSpecial Defense: ${raid_data.RaidPokemon.SpDefense}\nSpeed: ${raid_data.RaidPokemon.Speed}`;
                var raid_boss_image = getPokemons.imagefromid(raid_data.RaidPokemon.ID.toString(), pokemons, false, true);

                // Time String
                var raid_time_left_string = "";
                raid_time_left = new Date(new Date(raid_data.Timestamp).getTime() - new Date().getTime());
                raid_time_left_string = `${raid_time_left.getUTCHours().toString().padStart(2, "0")}:${raid_time_left.getUTCMinutes().toString().padStart(2, "0")}:${raid_time_left.getUTCSeconds().toString().padStart(2, "0")}`;

                var embed = new Discord.EmbedBuilder();
                if (raid_data.Started) embed.setTitle(`Raid Has Started!`);
                else embed.setTitle(`Raid Has Not Started!`);
                embed.setColor(getRaidColor(raid_data.RaidType));
                embed.addFields({ name: `Level ${raid_data.RaidPokemon.Level} ${raid_data.RaidPokemon.Name}`, value: stats_string, inline: false });

                var trainer_data = "";
                for (var i = 0; i < 4; i++) {
                    trainer_data += `Trainer #${i + 1}: ${raid_data.TrainersTag[i] != undefined ? raid_data.TrainersTag[i] : "None"}`
                    if (raid_data.CompletedDuel != undefined && raid_data.CompletedDuel.includes(raid_data.Trainers[i])) trainer_data += " :white_check_mark:\n";
                    else if (raid_data.CurrentDuel != undefined && raid_data.CurrentDuel == raid_data.Trainers[i]) trainer_data += " -> Currently Attacking\n";
                    else trainer_data += "\n";
                }

                embed.addFields({ name: `Trainers:`, value: trainer_data, inline: false });
                embed.addFields({ name: `Obtainable Rewards:`, value: getRewards(raid_data.RaidType, raid_data.RaidPokemon.Name), inline: false });
                embed.setImage('attachment://' + raid_boss_image[0] + ".png")
                description = `**${raid_data.Started ? `HP: ${raid_data.RaidPokemon.Health.toLocaleString()}/${raid_data.RaidPokemon.MaxHealth.toLocaleString()}\n` : ``}RaidID: ${raid_data.RaidID}\n` + `Difficulty: ${getDifficultyString(raid_data.RaidType)}\n` + `Time Left: ${raid_time_left_string}**`;
                embed.setDescription(description);
                embed.setFooter({ text: `To join this raid, do /r join ${raid_data.RaidID}. To start the raid, the raid leader needs to do /r start. To duel the raid boss, do /r duel.` })
                interaction.reply({ embeds: [embed], files: [raid_boss_image[1]] });
            }
            else return interaction.reply({ content: `You are not in a raid.`, ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "kick") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                var kick_id = interaction.options.get("slot").value;
                if (raid.Trainers[0] != interaction.user.id) return interaction.reply({ content: `You are not the raid leader.`, ephemeral: true });
                if (raid.Trainers[kick_id - 1] == interaction.user.id) return interaction.reply({ content: `You can't kick yourself.`, ephemeral: true });
                if (raid.Trainers[kick_id - 1] == undefined) return interaction.reply({ content: `No trainer found at that number.`, ephemeral: true });

                raid.Trainers.splice(kick_id - 1, 1);
                var kicked_user = raid.TrainersTag.splice(kick_id - 1, 1);
                raid.save().then(() => {
                    interaction.reply({ content: `You have kicked \`${kicked_user}\` from the raid.` });
                });

            } else return interaction.reply({ content: `You are not in a raid.`, ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "ban") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                var ban_id = interaction.options.get("slot").value;
                if (raid.Trainers[0] != interaction.user.id) return interaction.reply({ content: `You are not the raid leader.`, ephemeral: true });
                if (raid.Trainers[ban_id - 1] == interaction.user.id) return interaction.reply({ content: `You can't ban yourself.`, ephemeral: true });
                if (raid.Trainers[ban_id - 1] == undefined) return interaction.reply({ content: `No trainer found at that number.`, ephemeral: true });

                raid.Ban.push(raid.Trainers[ban_id - 1]);
                raid.Trainers.splice(ban_id - 1, 1);
                var banned_user = raid.TrainersTag.splice(ban_id - 1, 1);
                raid.save().then(() => {
                    interaction.reply({ content: `You have banned \`${banned_user}\` from the raid.` });
                });
            } else return interaction.reply({ content: `You are not in a raid.`, ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "leave") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                // Get user data.
                user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                    if (err) return console.log(err);
                    if (user) {
                        user.Raids.Left = user.Raids.Left != undefined ? user.Raids.Left + 1 : 1;
                        var remove_index = raid.Trainers.indexOf(interaction.user.id);
                        raid.Trainers.splice(remove_index, 1);
                        raid.TrainersTag.splice(remove_index, 1);

                        if (raid.CurrentDuel == interaction.user.id) {
                            raid.CurrentDuel = undefined;
                            raid.ChangeOnFainted = undefined;
                            raid.OldStreamText = undefined;

                            // Save HP
                            var save_data_raid_stream = {
                                pokemon: [
                                    {
                                        hp: raid.RaidPokemon.Health,
                                        maxhp: raid.RaidPokemon.MaxHealth
                                    }]
                            }
                            raid.RaidPokemon.RaidStream.raidside = JSON.stringify(save_data_raid_stream);
                        }

                        raid.save().then(() => {
                            user.save().then(() => {
                                interaction.reply({ content: `You have left the raid.` });
                            });
                        });
                    }
                });
            }
            else return interaction.reply({ content: "You are not in a raid.", ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "cancel") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                // Get user data.
                user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                    if (err) return console.log(err);
                    if (user) {
                        if (raid.CurrentDuel == interaction.user.id) {
                            // Check if other user exists.
                            raid.CompletedDuel.push(interaction.user.id);

                            // Find a user which has not completed duel.
                            var non_battled_user = raid.Trainers.filter(x => !raid.CompletedDuel.includes(x) && x != null);
                            if (non_battled_user.length > 0) {
                                raid.CurrentDuel = undefined;
                                raid.TrainersTeam = undefined;
                                raid.OldStreamText = 0;
                                raid.CurrentTurn = 0;
                                raid.markModified('TrainersTeam');

                                // Save HP
                                var save_data_raid_stream = {
                                    pokemon: [
                                        {
                                            hp: raid.RaidPokemon.Health,
                                            maxhp: raid.RaidPokemon.MaxHealth
                                        }]
                                }
                                raid.RaidPokemon.RaidStream.raidside = JSON.stringify(save_data_raid_stream);
                                raid_data.markModified('RaidPokemon');


                                raid.CurrentDuel = undefined;
                                raid.ChangeOnFainted = undefined;
                                raid.OldStreamText = undefined;

                                raid.save().then(() => {
                                    user.save().then(() => {
                                        interaction.reply({ content: `You have cancelled the raid duel.` });
                                    });
                                });
                            }
                            else {
                                raid.remove().then(() => {
                                    var channel_embed = new Discord.EmbedBuilder();
                                    channel_embed.setTitle(`Raid Boss Won!`);
                                    channel_embed.setDescription(`Since there was no one to battle, the raid boss has won the raid.`);
                                    channel_embed.setColor(interaction.member.displayHexColor);
                                    interaction.reply({ embeds: [channel_embed] });
                                    // Send Dm message to all users.
                                    for (var i = 0; i < raid.Trainers.length; i++) {
                                        if (raid.Trainers[i]) {
                                            if (!raid.MutedTrainers.includes(raid.Trainers[i])) bot.users.cache.get(raid.Trainers[i]).send(`The ${raid.RaidPokemon.Name} raid was not completed. Try better next time!`);
                                        }
                                    }
                                });
                            }
                        } else return interaction.reply({ content: `You are not in a raid duel.`, ephemeral: true });
                    }
                });
            }
            else return interaction.reply({ content: "You are not in a raid.", ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "mute") {
        // User check if raid is already muted.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) return console.log(err);
            if (user) {
                if (user.Raids.Muted) return interaction.reply({ content: `You already muted the raid messages.`, ephemeral: true });
                user.Raids.Muted = true;
                user.save().then(() => {
                    interaction.reply({ content: `You have muted the raid messages.` });
                });
            }
        });
    }
    else if (interaction.options.getSubcommand() === "unmute") {
        // User check if raid is already unmuted.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) return console.log(err);
            if (user) {
                if (!user.Raids.Muted) return interaction.reply({ content: `You have not muted the raid messages.`, ephemeral: true });
                user.Raids.Muted = false;
                user.save().then(() => {
                    interaction.reply({ content: `You have unmuted the raid messages.` });
                });
            }
        });
    }
    else if (interaction.options.getSubcommand() === "duel") {
        // User check if raid scheme has trainer included.
        raid_model.findOne({ $and: [{ Trainers: { $in: interaction.user.id } }, { Timestamp: { $gt: Date.now() } }] }, (err, raid) => {
            if (err) return console.log(err);
            if (raid) {
                prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
                    if (err) return console.log(err);
                    if (_duel) return interaction.reply({ content: "You can't raid pokémon while you are in a duel!", ephemeral: true });
                    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                        var team = user.Teams.filter(team => team.Selected == true)[0];
                        if (team == undefined) return interaction.reply({ content: `You should select a team or create a team to enter a raid duel!`, ephemeral: true });
                        if (!raid.Started) return interaction.reply({ content: "This raid has not started yet!", ephemeral: true });
                        if (raid.CurrentDuel != undefined && raid.CurrentDuel == interaction.user.id) return interaction.reply({ content: "You are already in duel with this raid boss!", ephemeral: true });
                        if (raid.CompletedDuel.includes(interaction.user.id)) return interaction.reply({ content: "You have already completed this raid duel!", ephemeral: true });
                        if (raid.CurrentDuel != undefined) return interaction.reply({ content: "A user is already dueling this raid boss!", ephemeral: true });
                        if (team.Pokemons.isNull()) return interaction.reply({ content: "Your team should not be empty.", ephemeral: true });

                        // Get pokemons details
                        getPokemons.getallpokemon(interaction.user.id).then(user_pokemons => {

                            // Transfer team pokemons to trainers data.
                            var trainer_data = transferTeamData(team, user_pokemons, pokemons);

                            // Check if trainer_data array is empty {} or undefined
                            if (trainer_data.every(x => _.isEmpty(x))) return interaction.reply({ content: "Your team should not be empty.", ephemeral: true });

                            var raid_moveset = movesparser.get_raid_moves_from_id(raid.RaidPokemon.ID, pokemons);
                            var raidmoves_to_stream = [];
                            for (i = 0; i < raid_moveset.length; i++) {
                                raidmoves_to_stream.push(raid_moveset[i][0]);
                            }

                            // Team Packing
                            var packed_team_1 = Teams.pack(trainer_data);
                            var packed_team_2 = Teams.pack([{
                                name: raid.RaidPokemon.Name + "_r",
                                species: raid.RaidPokemon.Name.includes("Gigantamax") ? raid.RaidPokemon.Name.replace("Gigantamax", "") + "gmax" : raid.RaidPokemon.Name,
                                level: raid.RaidPokemon.Level,
                                gender: '',
                                shiny: false,
                                gigantamax: raid.RaidPokemon.Name.includes("Gigantamax") ? true : false,
                                moves: raidmoves_to_stream,
                                ability: "",
                                evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
                                ivs: { hp: raid.RaidPokemon.IV[0], atk: raid.RaidPokemon.IV[1], def: raid.RaidPokemon.IV[2], spa: raid.RaidPokemon.IV[3], spd: raid.RaidPokemon.IV[4], spe: raid.RaidPokemon.IV[5] },
                            }]);

                            // Get image url of user team pokemon.
                            var user_pokemon_data = trainer_data.filter(pokemon => pokemon != null && !_.isEmpty(pokemon))[0];
                            var user_image_data = user_pokemon_data.Image;
                            var current_pokemon = trainer_data.indexOf(user_pokemon_data);

                            var _battleStream = new BattleStreams.BattleStream();
                            const streams = BattleStreams.getPlayerStreams(_battleStream);
                            const spec = { formatid: 'customgame' };

                            // Team null avoider.
                            packed_team_1 = packed_team_1.replaceAll("undefined|||-||||||||]", "").replaceAll("]undefined|||-||||||||", "");

                            const p1spec = { name: '$Player1', team: packed_team_1 };
                            const p2spec = { name: '$Player2', team: packed_team_2 };

                            // Packing raid data.
                            raid.CurrentDuel = interaction.user.id;
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
                                        raid.UserStreamPokemons = _battleStream.battle.sides[0].pokemon.filter(x => x.set.name != undefined).map(x => x.set.name);
                                        raid.save().then(() => {
                                            // Get image url of raid boss.
                                            var raid_boss_image_data = raid.RaidPokemon.Image;

                                            var raidside = null;
                                            if (raid.RaidPokemon.RaidStream != undefined && raid.RaidPokemon.RaidStream.raidside != undefined) {
                                                if (raid.RaidPokemon.RaidStream.field != undefined) {
                                                    _battleStream.battle.field = JSON.parse(raid.RaidPokemon.RaidStream.field);
                                                }
                                                if (raid.RaidPokemon.RaidStream.raidside != undefined) {
                                                    raidside = JSON.parse(raid.RaidPokemon.RaidStream.raidside);
                                                }
                                            } else raidside = _battleStream.battle.sides[1];

                                            // Background image url.
                                            var image_url = "./assets/raid_images/background.jpeg";
                                            if (_battleStream.battle.field.weather == "hail") image_url = "./assets/raid_images/background-hail.jpeg";
                                            else if (_battleStream.battle.field.weather == "sunny") image_url = "./assets/raid_images/background-sunny.jpeg";
                                            else if (_battleStream.battle.field.weather == "rain") image_url = "./assets/raid_images/background-rain.jpeg";
                                            else if (_battleStream.battle.field.weather == "sandstorm") image_url = "./assets/raid_images/background-sandstorm.jpeg";

                                            // Creating Image for embed.
                                            // Image 1
                                            sharp(user_image_data[1]).resize({ width: 200, height: 200 }).toBuffer().then(function (one) {
                                                // Image 2
                                                sharp(raid_boss_image_data[1]).resize({ width: 360, height: 360 }).toBuffer().then(function (two) {
                                                    sharp(image_url)
                                                        .composite([{ input: one, top: 180, left: 80 }, { input: two, top: 20, left: 430 }])
                                                        .jpeg({ quality: 100 })
                                                        .toBuffer("jpeg").then((image_buffer) => {

                                                            // Sending duel message.
                                                            var embed = new Discord.EmbedBuilder();
                                                            embed.setTitle(`${interaction.user.username.toUpperCase()} VS Raid Boss!`);
                                                            embed.setDescription(`**Weather: ${_battleStream.battle.field.weather == "" ? "Clear Skies" : _.capitalize(_battleStream.battle.field.weather)}**${_battleStream.battle.field.terrain == "" ? "" : "\n**Terrain: " + _.capitalize(_battleStream.battle.field.terrain.replace("terrain", "") + "**")}`);
                                                            embed.addFields({ name: `${interaction.user.username}'s Pokémon`, value: `${user_pokemon_data.name.replaceAll("_r", "").slice(0, -2)} | ${user_pokemon_data.max_hp}/${user_pokemon_data.max_hp}HP`, inline: true });
                                                            embed.addFields({ name: `Raid Boss`, value: `${raid.RaidPokemon.Name.replaceAll("_r", "")} | ${raidside.pokemon[0].hp}/${raidside.pokemon[0].maxhp}HP`, inline: true });
                                                            embed.setColor(interaction.member.displayHexColor);
                                                            embed.setImage('attachment://img.jpeg');
                                                            embed.setFooter({ text: `Use /team to see the current state of your team as well as what moves your pokémon has available to them!` });
                                                            interaction.reply({ embeds: [embed], files: [{ attachment: image_buffer, name: 'img.jpeg' }] });

                                                            // Get user data.
                                                            user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                                                                if (err) return;
                                                                if (user) {
                                                                    user.Raids.TotalDuels = user.Raids.TotalDuels ? user.Raids.TotalDuels + 1 : 1;
                                                                    user.save();
                                                                }
                                                            });
                                                        });
                                                });
                                            });
                                        });
                                    } else {
                                        return interaction.reply({ content: `Something went wrong, we could not start the raid duel.`, ephemeral: true });
                                    }
                                }
                            })();
                        });
                    });
                });
            }
            else return interaction.reply({ content: `You are not in a raid.`, ephemeral: true });
        });
    }
    else if (interaction.options.getSubcommand() === "profile") {

        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) return;
            if (!user) return;

            var footer_string = "";
            var last_raid_time = user.Raids.SpawnTimestamp;

            if (last_raid_time == undefined || (new Date().getTime() - last_raid_time) > 1800000) {
                footer_string = `Use /raid spawn to spawn a raid.`;
            } else {
                // Get time left until next raid spawn in hh:mm:ss format.
                var time_left = new Date(last_raid_time + 1800000 - Date.now());
                footer_string = "Time left to be able to spawn a raid: " + time_left.getUTCHours().toString().toString().padStart(2, "0") + ":" + time_left.getUTCMinutes().toString().toString().padStart(2, "0") + ":" + time_left.getUTCSeconds().toString().padStart(2, "0");
            }

            var user_raid = user.Raids;
            var easy = user_raid.Completed.Easy ? user_raid.Completed.Easy : 0;
            var normal = user_raid.Completed.Normal ? user_raid.Completed.Normal : 0;
            var hard = user_raid.Completed.Hard ? user_raid.Completed.Hard : 0;
            var challenge = user_raid.Completed.Challenge ? user_raid.Completed.Challenge : 0;
            var intense = user_raid.Completed.Intense ? user_raid.Completed.Intense : 0;
            var gmax = user_raid.Completed.Gigantamax ? user_raid.Completed.Gigantamax : 0;
            var total_raids_completed = easy + normal + hard + challenge + intense;

            var embed = new Discord.EmbedBuilder();
            embed.setTitle(`${interaction.user.username}'s Raid Profile`);
            embed.setColor(interaction.member.displayHexColor);
            embed.setThumbnail(interaction.user.avatarURL());
            embed.setDescription(`**Total Raids Completed:** ${total_raids_completed}`
                + `\n**Easy Raids Completed:** ${easy}`
                + `\n**Normal Raids Completed:** ${normal}`
                + `\n**Hard Raids Completed:** ${hard}`
                + `\n**Challenge Raids Completed:** ${challenge}`
                + `\n**Intense Raids Completed:** ${intense}`
                + `\n**Gigantamax Raids Completed:** ${gmax}`
                + `\n**Total Damage Dealt To Raid Bosses:** ${user_raid.TotalDamage ? user_raid.TotalDamage.toLocaleString() : 0}`);
            embed.setFooter({ text: footer_string });
            interaction.reply({ embeds: [embed] });
        });
    }
    else if (interaction.options.getSubcommand() === "dex" || interaction.options.getSubcommand() === "eventdex") {

        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) return;
            if (!user) return;

            if (interaction.options.getSubcommand() === "dex") var raid_pokemons = pokemons.filter(it => ((it["Legendary Type"] === "Mythical" || it["Primary Ability"] === "Beast Boost" || it["Legendary Type"] === "Legendary" || it["Legendary Type"] === "Sub-Legendary") && (it["Alternate Form Name"] === "Galar" || it["Alternate Form Name"] === "Alola" || it["Alternate Form Name"] === "Hisuian" || it["Alternate Form Name"] === "NULL") && !config.RAID_EXCEPTIONAL_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"])) || config.RAID_INCLUDE_POKEMON.some(ae => ae[0] == it["Pokemon Name"] && ae[1] == it["Alternate Form Name"]));
            else if (interaction.options.getSubcommand() === "eventdex") var raid_pokemons = pokemons.filter(it => it["Alternate Form Name"] == "Gigantamax");

            var is_eventdex = false;
            if (interaction.options.getSubcommand() === "eventdex") is_eventdex = true;

            // filters
            var args = interaction.options.get("filter") ? interaction.options.get("filter").value.split(" ") : [];

            for (var i = 0; i < raid_pokemons.length; i++) {
                var dex_data = [];
                if (is_eventdex) dex_data = user.Raids.EventDex.filter(it => it.PokemonId == raid_pokemons[i]["Pokemon Id"]);
                else dex_data = user.Raids.RaidDex.filter(it => it.PokemonId == raid_pokemons[i]["Pokemon Id"]);
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
            if (args.length == 0) return create_pagination(interaction, "Your raid dex", 0, raid_pokemons);
            else if (args.length == 1 && args[0] == "--uncompleted") {
                raid_pokemons = raid_pokemons.filter(it => it.totaldefeated == 0);
                return create_pagination(interaction, "Your uncompleted raids", 0, raid_pokemons);
            }
            else if (args.length == 1 && args[0] == "--completed") {
                raid_pokemons = raid_pokemons.filter(it => it.totaldefeated > 0);
                return create_pagination(interaction, "Your completed raids", 0, raid_pokemons);
            }
            else if (args.length > 1 && (args[0] == "--n" || args[0] == "--name")) {
                args.shift();
                var name = args.join(" ");
                raid_pokemons = raid_pokemons.filter(it => it.fullname.toLowerCase().replace(":", "").includes(name.toLowerCase().replace(":", " ")));
                if (raid_pokemons.length == 0) return interaction.reply({ content: "Unable to find any raid pokemon with that name.", ephemeral: true });
                return create_pagination(interaction, "Your raids", 0, raid_pokemons);
            }
            else return interaction.reply({ content: "Invalid arguments.", ephemeral: true });

        });
    }
    else return interaction.reply({ content: "Invalid syntax.", ephemeral: true });
}

// Function to create pagination for dex.
function create_pagination(interaction, title = "Raid Dex", page = 0, raid_pokemons) {
    if (raid_pokemons == undefined || raid_pokemons == null || !raid_pokemons || raid_pokemons.length == 0) return interaction.reply({ content: "No data found.", ephemeral: true });

    var total_defeated_pokemons = raid_pokemons.filter(it => it.totaldefeated > 0);
    var description = `You have defeated ${total_defeated_pokemons.length}/${raid_pokemons.length} raid bosses!`;

    var temp_counter = 0;
    var tot_len = raid_pokemons.length;
    var split_chunks = spliceIntoChunks(raid_pokemons, 20);
    var embeds = [];
    var current_index = 0;
    for (i = 0; i < split_chunks.length; i++) {
        embeds[i] = new Discord.EmbedBuilder();
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
            embeds[i].addFields({ name: split_chunks[i][j].fullname, value: raid_field_data, inline: false });
        }
        embeds[i].setDescription(description);
        embeds[i].setFooter({ text: `Page: ${i + 1}/${split_chunks.length} Showing ${current_index} to ${(current_index - 1) + split_chunks[i].length} out of ${tot_len}` });
    }
    interaction.reply({ embeds: [embeds[page]] }).then(msg => {
        if (split_chunks.length > 1) return pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, embeds, 0);
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
                var EV = pokemon_from_db.EV != undefined && pokemon_from_db.EV.length > 1 ? pokemon_from_db.EV : [0, 0, 0, 0, 0, 0];

                var data_to_add = {
                    name: getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, false) + "_r_" + (i + 1),
                    species: getPokemons.get_pokemon_name_from_id(pokemon_from_db["PokemonId"], pokemons, false, false, true),
                    gender: "",
                    shiny: pokemon_from_db.Shiny,
                    gigantamax: false,
                    level: pokemon_from_db.Level,
                    ivs: { hp: pokemon_from_db.IV[0], atk: pokemon_from_db.IV[1], def: pokemon_from_db.IV[2], spa: pokemon_from_db.IV[3], spd: pokemon_from_db.IV[4], spe: pokemon_from_db.IV[5] },
                    Image: image,
                    ability: "",
                    evs: { hp: EV[0], atk: EV[1], def: EV[2], spa: EV[3], spd: EV[4], spe: EV[5] },
                    nature: nature_name,
                    moves: move_data,
                    fainted: false,
                    selected: false,
                    max_hp: floor(0.01 * (2 * hp + pokemon_from_db.IV[0] + floor(0.25 * EV[0])) * pokemon_from_db.Level) + pokemon_from_db.Level + 10,
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
    description: "Defeat raid bosses and get rewards!",
    options: [{
        name: "spawn",
        description: "Spawn a raid boss!",
        type: 1,
        options: [{
            name: "gmax",
            description: "Spawn a Gmax raid boss!",
            type: 3,
            choices: [{
                name: "yes",
                value: "yes"
            }]
        }]
    }, {
        name: "start",
        description: "Start a raid!",
        type: 1
    }, {
        name: "duel",
        description: "Duel a raid boss!",
        type: 1
    }, {
        name: "mute",
        description: "Mute a raid boss!",
        type: 1
    }, {
        name: "unmute",
        description: "Unmute a raid boss!",
        type: 1
    }, {
        name: "leave",
        description: "Leave a raid!",
        type: 1
    }, {
        name: "join",
        description: "Join a raid!",
        type: 1,
        options: [{
            name: "id",
            description: "Raid ID",
            type: 4,
            min_value: 1,
            required: true
        }]
    }, {
        name: "info",
        description: "Get raid info!",
        type: 1
    }, {
        name: "cancel",
        description: "Cancel a raid!",
        type: 1
    }, {
        name: "profile",
        description: "Get raid profile!",
        type: 1
    }, {
        name: "dex",
        description: "Get raid dex!",
        type: 1,
        options: [{
            name: "filter",
            description: "Filter for raid dex",
            type: 3,
            min_length: 1
        }]
    }, {
        name: "eventdex",
        description: "Get raid event dex!",
        type: 1,
        options: [{
            name: "filter",
            description: "Filter for raid event dex",
            type: 3,
            min_length: 1
        }]
    }, {
        name: "kick",
        description: "Kick a player from a raid!",
        type: 1,
        options: [{
            name: "slot",
            description: "User to kick",
            type: 4,
            required: true,
            min_value: 1,
            max_value: 4
        }]
    }, {
        name: "ban",
        description: "Ban a player from a raid!",
        type: 1,
        options: [{
            name: "slot",
            description: "User to ban",
            type: 4,
            required: true,
            min_value: 1,
            max_value: 4
        }]
    }],
    aliases: []
}