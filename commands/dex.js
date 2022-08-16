const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // Array sorting module.

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');
const getDexes = require('../utils/getDex');

// Initialize the variable.
var pokemons_from_database = [];

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    // Get all user pokemons.
    getDexes.getalldex(interaction.user.id).then((data) => {
        pokemons_from_database = data;

        var args = interaction.options.get("cmd") ? interaction.options.get("cmd").value.split(" ") : [];

        //Check if its dex arguements
        if (args.length == 0 || isInt(args[0])) { dex_pokemons(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "rewards") { rewards(interaction); return; }
        if (args[0] == "claim" && args[1] == "all") { claim_all(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "claim" && args[1] != "all") { claim(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--ub" || args[0] == "--ultrabeast") { dex_ultrabeast(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--l" || args[0] == "--legendary") { dex_legendary(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--m" || args[0] == "--mythical") { dex_mythical(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--a" || args[0] == "--alolan") { dex_alolan(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--h" || args[0] == "--hisuian") { dex_hisuian(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--g" || args[0] == "--galarian") { dex_galarian(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--gen" || args[0] == "--generation" && isInt(args[1])) { dex_generation(bot, interaction, rgs, user_available, pokemons); return; }
        if (args[0] == "--t" || args[0] == "--type" && args[1] != undefined) { dex_type(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--n" || args[0] == "--name" && args[1] != undefined) { dex_name(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--p" || args[0] == "--pseudo") { dex_pseudo(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--s" || args[0] == "--starter") { dex_starter(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--c" || args[0] == "--caught") { dex_caught(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--uc" || args[0] == "--uncaught") { dex_uncaught(bot, interaction, args, user_available, pokemons); return; }
        if (args[0] == "--od" || args[0] == "--orderd") { dex_orderd(bot, interaction, args, user_available, pokemons); return; }

        //#region Create Message

        pokemon = getPokemons.getPokemonData(args, pokemons, true);
        if (pokemon == null) return interaction.reply({ content: "Pokemon not found!", ephemeral: true });

        // No of caught
        //Getting the data from the user model
        var no_of_caught = 0;
        // Get number of catached pokemons.
        no_of_caught = pokemons_from_database.filter(it => it["PokemonId"] === pokemon["Pokemon Id"]).length;

        // Evolution
        var evolution = "";
        var type = "";

        // Tyrogue Exception
        if (pokemon["Pokemon Id"] == "360") {
            evolution = "Tyrogue evolves to Hitmonlee starting from level 20 when its Attack is higher than its Defense, evolves to Hitmonchan starting from level 20 and evolves to Hitmontop starting from level 20 when its Attack is equal to its Defense.\n"
        }
        // Cosmoem Exception
        else if (pokemon["Pokemon Id"] == "1320") {
            evolution = "Cosmoem evolves to Solgaleo starting from level 53 during day and evolves to Lunala starting from level 53 during night.\n"
        }
        // No info for eevee
        else if (pokemon["Pokemon Id"] == "228") {
            evolution = "";
        }
        else if (pokemon.Evolution != "NULL" && pokemon.Evolution.Reason == "Level" && pokemon["Evolution Stone"] == undefined && pokemon["Evolution Trade"] == undefined) {
            var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution.Id, pokemons, false);
            evolution = `${pokemon.name_no_shiny} evolves into ${evolves_to} starting at ${pokemon.Evolution.Level} Level ${pokemon.Evolution.Time != undefined ? "during " + pokemon.Evolution.Time.toLowerCase() : ""}\n`;
        }
        else if (pokemon.Evolution != "NULL" && pokemon.Evolution.Reason != "Level" && pokemon["Evolution Stone"] == undefined && pokemon["Evolution Trade"] == undefined) {
            if (Array.isArray(pokemon.Evolution)) {
                for (p = 0; p < pokemon.Evolution.length; p++) {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution[p].Id, pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} while holding ${pokemon.Evolution[p].Reason} ${pokemon.Evolution[p].Time != undefined ? "during " + pokemon.Evolution[p].Time.toLowerCase() : ""}\n`;
                }
            }
            else {
                var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution.Id, pokemons, false);
                evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} while holding ${pokemon.Evolution.Reason} ${pokemon.Evolution.Time != undefined ? "during " + pokemon.Evolution.Time.toLowerCase() : ""}\n`;
            }
        }
        else if (pokemon.Evolution == "NULL" && pokemon["Evolution Stone"] == undefined && pokemon["Evolution Trade"] != undefined) {
            if (_.isArray(pokemon["Evolution Trade"][0])) {
                for (var i = 0; i < pokemon["Evolution Trade"].length; i++) {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Trade"][i][1], pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by trading ${pokemon["Evolution Trade"][i][0] != "NULL" ? "with " + pokemon["Evolution Trade"][i][0] : ""} ${pokemon["Evolution Trade"][i][2] != undefined ? "during " + pokemon["Evolution Trade"][i][2].toLowerCase() : ""}\n`;
                }
            }
            else {
                var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Trade"][1], pokemons, false);
                evolution = `${pokemon.name_no_shiny} evolves into ${evolves_to} by trading ${pokemon["Evolution Trade"][0] != "NULL" ? "with " + pokemon["Evolution Trade"][0] : ""} ${pokemon["Evolution Trade"][2] != undefined ? "during " + pokemon["Evolution Trade"][2].toLowerCase() : ""}\n`;
            }
        }
        else if (pokemon.Evolution == "NULL" && pokemon["Evolution Stone"] != undefined && pokemon["Evolution Trade"] == undefined) {
            if (_.isArray(pokemon["Evolution Stone"][0])) {
                for (var i = 0; i < pokemon["Evolution Stone"].length; i++) {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Stone"][i][1], pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by using ${pokemon["Evolution Stone"][i][0]} ${pokemon["Evolution Stone"][i][2] != undefined ? "during " + pokemon["Evolution Stone"][i][2].toLowerCase() : ""}\n`;
                }
            }
            else {
                var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Stone"][1], pokemons, false);
                evolution = `${pokemon.name_no_shiny} evolves into ${evolves_to} by using ${pokemon["Evolution Stone"][0]} ${pokemon["Evolution Stone"][2] != undefined ? "during " + pokemon["Evolution Stone"][2].toLowerCase() : ""}\n`;
            }
        }
        else if (move_evolve(pokemon["Pokemon Id"]) != null) {
            var move_evolve_return = move_evolve(pokemon["Pokemon Id"]);
            var evolves_to = getPokemons.get_pokemon_name_from_id(move_evolve_return[0], pokemons, false);
            evolution = `${pokemon.name_no_shiny} evolves into ${evolves_to} by learning ${move_evolve_return[1]}\n`;
        }
        else if (pokemon["Evolution Stone"] != undefined || pokemon["Evolution Trade"] != undefined) {

            if (pokemon.Evolution != "NULL") {
                // Evolution By Level
                if (pokemon.Evolution.Reason == "Level") {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution.Id, pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} starting at ${pokemon.Evolution.Level} Level ${pokemon.Evolution.Time != undefined ? "during " + pokemon.Evolution.Time.toLowerCase() : ""}\n\n`;
                }

                // Evolution By Level/Others -in Array
                if (_.isArray(pokemon.Evolution)) {
                    for (var i = 0; i < pokemon.Evolution.length; i++) {
                        if (pokemon.Evolution[i].Reason == "Level") {
                            var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution[i].Id, pokemons, false);
                            evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} starting at ${pokemon.Evolution[i].Level} Level ${pokemon.Evolution[i].Time != undefined ? "during " + pokemon.Evolution[i].Time.toLowerCase() : ""}\n`;
                        }
                        else if (pokemon.Evolution[i].Reason != "Level") {
                            var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon.Evolution[i].Id, pokemons, false);
                            evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} while holding ${pokemon.Evolution[i].Reason} ${pokemon.Evolution[i].Time != undefined ? "during " + pokemon.Evolution[i].Time.toLowerCase() : ""}\n`;
                        }
                    }
                    evolution += "\n";
                }
            }

            // Evolution Stone
            if (pokemon["Evolution Stone"] != undefined && _.isArray(pokemon["Evolution Stone"][0])) {
                for (var i = 0; i < pokemon["Evolution Stone"].length; i++) {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Stone"][i][1], pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by using ${pokemon["Evolution Stone"][i][0]} ${pokemon["Evolution Stone"][i][2] != undefined ? "during " + pokemon["Evolution Stone"][i][2].toLowerCase() : ""}\n`;
                }
                evolution += "\n";
            }
            else if (pokemon["Evolution Stone"] != undefined) {
                var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Stone"][1], pokemons, false);
                evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by using ${pokemon["Evolution Stone"][0]} ${pokemon["Evolution Stone"][2] != undefined ? "during " + pokemon["Evolution Stone"][2].toLowerCase() : ""}\n\n`;
            }

            // Evolution Trade
            if (pokemon["Evolution Trade"] != undefined && _.isArray(pokemon["Evolution Trade"][0])) {
                for (var i = 0; i < pokemon["Evolution Trade"].length; i++) {
                    var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Trade"][i][1], pokemons, false);
                    evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by trading ${pokemon["Evolution Trade"][i][0] != "NULL" ? "with " + pokemon["Evolution Trade"][i][0] : ""} ${pokemon["Evolution Trade"][i][2] != undefined ? "during " + pokemon["Evolution Trade"][i][2].toLowerCase() : ""}\n`;
                }
                evolution += "\n";
            }
            else if (pokemon["Evolution Trade"] != undefined) {
                var evolves_to = getPokemons.get_pokemon_name_from_id(pokemon["Evolution Trade"][1], pokemons, false);
                evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by trading ${pokemon["Evolution Trade"][0] != "NULL" ? "with " + pokemon["Evolution Trade"][0] : ""} ${pokemon["Evolution Trade"][2] != undefined ? "during " + pokemon["Evolution Trade"][2].toLowerCase() : ""}\n\n`;
            }

            // Evolution Move
            if (move_evolve(pokemon["Pokemon Id"]) != null) {
                var move_evolve_return = move_evolve(pokemon["Pokemon Id"]);
                var evolves_to = getPokemons.get_pokemon_name_from_id(move_evolve_return[0], pokemons, false);
                evolution += `${pokemon.name_no_shiny} evolves into ${evolves_to} by learning ${move_evolve_return[1]}\n`;
            }
        }

        // Type
        if (pokemon["Secondary Type"] != "NULL") { type = pokemon["Primary Type"] + " | " + pokemon["Secondary Type"] }
        else { type = pokemon["Primary Type"]; }

        // Create embed message
        let embed = new Discord.EmbedBuilder();
        embed.setImage('attachment://' + pokemon.imagename)
        embed.setTitle("**Base stats for " + pokemon.name_no_shiny + "**")
        embed.setColor(interaction.member ? interaction.member.displayHexColor : '#000000')
        embed.setDescription(evolution + "\n"
            + "**Alternative Names:**\n🇯🇵 " + pokemon["jp_name"].join("/") + "\n🇩🇪 " + pokemon["dr_name"] + "\n🇫🇷 " + pokemon["fr_name"] + "\n\n"
            + "**Type: " + type + '**\n'
            + "**HP:** " + pokemon["Health Stat"] + '\n'
            + "**Attack:** " + pokemon["Attack Stat"] + '\n'
            + "**Defense:** " + pokemon["Defense Stat"] + '\n'
            + "**Sp. Atk:** " + pokemon["Special Attack Stat"] + '\n'
            + "**Sp. Def:** " + pokemon["Special Defense Stat"] + '\n'
            + "**Speed:** " + pokemon["Speed Stat"] + '\n')
        embed.setFooter({ text: `Dex Number: ${pokemon["Pokedex Number"]} \nNumber caught: ${no_of_caught}` });
        interaction.reply({ embeds: [embed], files: [pokemon.imageurl] });
        //#endregion
    });
    // }
}

// To display all rewards.
function rewards(interaction) {

    // Getting the data from the user model
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardAmount"] > 0);
        var no_of_rewards = rewards.length;
        if (no_of_rewards == 0) return interaction.reply({ content: "You have no rewards to claim.", ephemeral: true });
        if (no_of_rewards > 25) return interaction.reply({ content: "You have too many rewards to view. Please claim them.", ephemeral: true });

        var rewards_amount = 0;
        for (var i = 0; i < no_of_rewards; i++) {
            rewards_amount += rewards[i]["RewardAmount"];
        }

        // Create embed message
        let embed = new Discord.EmbedBuilder();
        embed.setTitle("**Pokedex**")
        embed.setColor(interaction.member ? interaction.member.displayHexColor : '#000000')
        embed.setDescription(`You have ${no_of_rewards} dex rewards to claim. You will get ${rewards_amount} credits`);
        for (i = 0; i < no_of_rewards; i++) {
            embed.addFields({ name: rewards[i].RewardName, value: rewards[i].RewardDescription + ' :money_with_wings:', inline: true });
        }
        interaction.reply({ embeds: [embed] });

    });
}

// To claim all rewards.
function claim_all(bot, interaction, args, user_available, pokemons) {
    // Getting the data from the user model
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardAmount"] > 0);
        var no_of_rewards = rewards.length;
        if (no_of_rewards == 0) return interaction.reply({ content: "You have no rewards to claim.", ephemeral: true });
        var rewards_amount = 0;

        for (var i = 0; i < no_of_rewards; i++) {
            rewards_amount += rewards[i]["RewardAmount"];
        }

        for (var i = 0; i < dex_rewards.length; i++) {
            dex_rewards[i]["RewardAmount"] = 0;
        }

        user_model.findOneAndUpdate({ UserID: interaction.user.id }, { $set: { DexRewards: dex_rewards }, $inc: { PokeCredits: rewards_amount } }, { new: true }, (err, user) => {
            if (err) return console.log(err);
        });
        // Message
        interaction.reply({ content: `You claimed ${no_of_rewards} dex rewards and ${rewards_amount} credits!` });

    });

}

// To claim certain rewards.
function claim(bot, interaction, args, user_available, pokemons) {
    // Getting the data from the user model
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        if (args.length == 1) return interaction.reply({ content: "You need to specify which reward you want to claim or use /dex claim all", ephemeral: true });
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardName"].toLowerCase() == args[1].toLowerCase());
        var reward_index = dex_rewards.findIndex(it => it["RewardName"].toLowerCase() == args[1].toLowerCase());
        var no_of_rewards = rewards.length;
        if (no_of_rewards == 0) return interaction.reply({ content: "No reward found in that name.", ephemeral: true });

        let reward_name = rewards[0]["RewardName"];
        let rewards_amount = rewards[0]["RewardAmount"];
        dex_rewards[reward_index]["RewardAmount"] = 0;

        user_model.findOneAndUpdate({ UserID: interaction.user.id }, { $set: { DexRewards: dex_rewards }, $inc: { PokeCredits: rewards_amount } }, { new: true }, (err, user) => {
            if (err) return console.log(err);
        })

        // Message
        interaction.reply({ content: `You claimed ${reward_name} dex reward and ${rewards_amount} credits!` });
    });
}

// To print all ultrabeast pokemons.
function dex_ultrabeast(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Primary Ability"] === "Beast Boost" && it["Alternate Form Name"] === "NULL");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokemon Id'], ['asc']);
    create_pagination(interaction, dex_pokemons, "ultra beast ");
}

// To print all legendary pokemons.
function dex_legendary(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL" && it["Primary Ability"] != "Beast Boost"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokemon Id'], ['asc']);
    create_pagination(interaction, dex_pokemons, "legendary ");
}

// To print all mythical pokemons.
function dex_mythical(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons, "mythical ");
}

// To print all alolan pokemons.
function dex_alolan(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons, "alolan ", "Alolan ");
}

// To print all hisuian pokemons.
function dex_hisuian(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Hisuian");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons, "hisuian ", "Hisuian ");
}

// To print all galarian pokemons.
function dex_galarian(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons, "galarian ", "Galarian ");
}

// To print all pokemons
function dex_pokemons(bot, interaction, args, user_available, pokemons) {
    var new_alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola")
    for (i = 0; i < new_alolan_pokemons.length; i++) {
        new_alolan_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_alolan_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var new_galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar")
    for (i = 0; i < new_galarian_pokemons.length; i++) {
        new_galarian_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_galarian_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var new_hisuian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Hisuian")
    for (i = 0; i < new_hisuian_pokemons.length; i++) {
        new_hisuian_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_hisuian_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    dex_pokemons = dex_pokemons.concat(new_galarian_pokemons).concat(new_alolan_pokemons).concat(new_hisuian_pokemons);
    if (isInt(args[0])) { var page = args[0] - 1 }
    create_pagination(interaction, dex_pokemons, "", "", page);
}

// To print all pokemons based on generation.
function dex_generation(bot, interaction, args, user_available, pokemons) {
    var filtered_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    var generation = args[1];
    if (generation == 1) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 0 && it["Pokedex Number"] < 152);
    } else if (generation == 2) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 151 && it["Pokedex Number"] < 252);
    } else if (generation == 3) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 251 && it["Pokedex Number"] < 387);
    } else if (generation == 4) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 386 && it["Pokedex Number"] < 494);
    } else if (generation == 5) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 493 && it["Pokedex Number"] < 651);
    } else if (generation == 6) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 650 && it["Pokedex Number"] < 722);
    } else if (generation == 7) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 721 && it["Pokedex Number"] < 810);
    } else if (generation == 8) {
        var dex_pokemons = filtered_pokemons.filter(it => it["Pokedex Number"] > 809 && it["Pokedex Number"] < 899);
    } else return interaction.reply({ content: "Invalid generation value.", ephemeral: true });
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons);
}

// To print all pokemon based on type.
function dex_type(bot, interaction, args, user_available, pokemons) {
    var filtered_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    var type = args[1];
    var primary_types = filtered_pokemons.filter(it => it["Primary Type"].toLowerCase() === type.toLowerCase());
    var secondary_types = filtered_pokemons.filter(it => it["Secondary Type"].toLowerCase() === type.toLowerCase());
    var dex_pokemons = primary_types.concat(secondary_types);
    if (dex_pokemons.length == 0) return interaction.reply({ content: "Invalid type value.", ephemeral: true });
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons);
}

// To print pokemon based on name.
function dex_name(bot, interaction, args, user_available, pokemons) {
    var filtered_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    var name = args[1];
    var dex_pokemons = filtered_pokemons.filter(it => it["Pokemon Name"].toLowerCase() === name.toLowerCase());
    if (dex_pokemons.length == 0) return interaction.reply({ content: "Invalid type value.", ephemeral: true });
    create_pagination(interaction, dex_pokemons);
}

// Function to display pseudo pokemons.
function dex_pseudo(bot, interaction, args, user_available, pokemons) {
    var pseudo_list = ["Dratini", "Dragonair", "Dragonite", "Larvitar", "Pupitar", "Tyranitar", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Gible", "Gabite", "Garchomp", "Deino", "Zweilous", "Hydreigon", "Goomy", "Sliggoo", "Goodra", "Jangmo-o", "Hakkamo-o", "Kommo-o", "Dreepy", "Drakloak", "Dragapult"];
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = dex_pokemons.filter(it => pseudo_list.includes(it["Pokemon Name"]));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons, "Pseudo ");
}

// Function to display starter pokemons.
function dex_starter(bot, interaction, args, user_available, pokemons) {
    var starter_list = ["Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic", "Mudkip", "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin", "Froakie", "Rowlet", "Litten", "Popplio", "Grookey", "Scorbunny", "Sobble"];
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = dex_pokemons.filter(it => starter_list.includes(it["Pokemon Name"]));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(interaction, dex_pokemons);
}

// Function to display uncaught pokemons.
function dex_uncaught(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    //Get user data from database
    var user_pokemons = pokemons_from_database;
    for (var i = 0; i < user_pokemons.length; i++) {
        dex_pokemons = dex_pokemons.filter(it => it["Pokemon Id"] != user_pokemons[i]["PokemonId"].toString());
    }
    create_pagination(interaction, dex_pokemons, "", "", 0, dex_pokemons.length);
}

// Function to display caught pokemons.
function dex_caught(bot, interaction, args, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    var new_dex_pokemons = [];
    var user_pokemons = pokemons_from_database;
    for (var i = 0; i < user_pokemons.length; i++) {
        var pokemon = dex_pokemons.find(it => it["Pokemon Id"] === user_pokemons[i]["PokemonId"].toString());
        if (pokemon) new_dex_pokemons.push(pokemon);
    }
    new_dex_pokemons = _.uniqBy(new_dex_pokemons, 'Pokemon Id');
    var total_pokemons_uncaught = dex_pokemons.length - _.uniq(new_dex_pokemons).length;
    create_pagination(interaction, new_dex_pokemons, "", "", 0, total_pokemons_uncaught);
}

// Function to display orderd pokemons.
function dex_orderd(bot, interaction, args, user_available, pokemons) {
    var new_alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola")
    for (i = 0; i < new_alolan_pokemons.length; i++) {
        new_alolan_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_alolan_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var new_galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar")
    for (i = 0; i < new_galarian_pokemons.length; i++) {
        new_galarian_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_galarian_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var new_hisuian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Hisuian")
    for (i = 0; i < new_hisuian_pokemons.length; i++) {
        new_hisuian_pokemons[i]["Pokemon Name"] = getPokemons.get_pokemon_name_from_id(new_hisuian_pokemons[i]["Pokemon Id"], pokemons, false);
    }
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    dex_pokemons = dex_pokemons.concat(new_galarian_pokemons).concat(new_alolan_pokemons).concat(new_hisuian_pokemons);

    create_pagination(interaction, dex_pokemons, "", "", 0, 0, true);
}

// Function to create pages in embeds.
function create_pagination(interaction, dex_pokemons, description_string = "", field_prefix = "", page = 0, total_pokemons_uncaught = 0, orderd = false) {

    var user_pokemons = pokemons_from_database;

    // User pokemon filter
    var user_index = [];
    for (i = 0; i < user_pokemons.length; i++) {
        user_index.push(parseInt(user_pokemons[i]["PokemonId"]));
    }

    if (orderd) {
        const count = id =>
            id.reduce((a, b) => ({
                ...a,
                [b]: (a[b] || 0) + 1
            }), {})
        obj = count(user_index);
        obj = Object.keys(obj).map(function (v) {
            return [v, obj[v]]
        }).sort(function (p, t) {
            return t[1] - p[1];
        });
        for (var i = obj.length - 1; i >= 0; i--) {
            var index = dex_pokemons.findIndex(it => it["Pokemon Id"] === obj[i][0]);
            var new_pokemon = dex_pokemons.splice(index, 1);
            dex_pokemons = new_pokemon.concat(dex_pokemons);
        }
    }

    var chunked_dex = chunkArray(dex_pokemons, 21);
    var no_of_dex = dex_pokemons.length;
    var global_embed = [];
    var total_caught = 0;
    var old_chunked_dex_count = 1;
    var not_caught_count = 0;
    var no_of_caught = 0;
    for (a = 0; a < chunked_dex.length; a++) {
        if (chunked_dex[a] == undefined) break;
        // Chunk filter
        var chunked_index = [];
        for (i = 0; i < chunked_dex[a].length; i++) {
            chunked_index.push(parseInt(chunked_dex[a][i]["Pokemon Id"]));
        }

        // Create embed message
        let embed = new Discord.EmbedBuilder();
        embed.setTitle("**Pokedex**")
        embed.setColor(interaction.member ? interaction.member.displayHexColor : '#000000')
        embed.setFooter({ text: `Page: ${a + 1}/${chunked_dex.length} Showing ${old_chunked_dex_count} to ${old_chunked_dex_count + chunked_dex[a].length - 1} out of ${no_of_dex}` });

        for (i = 0; i < chunked_dex[a].length; i++) {
            if (user_index.includes(chunked_index[i])) {
                no_of_caught = user_index.filter(x => x == chunked_index[i]).length
                total_caught++;
                embed.addFields({ name: field_prefix + chunked_dex[a][i]["Pokemon Name"], value: `${no_of_caught} caught!  :white_check_mark:`, inline: true });
            } else {
                not_caught_count++;
                embed.addFields({ name: field_prefix + chunked_dex[a][i]["Pokemon Name"], value: `Not caught yet  :x:`, inline: true });
            }
        }

        global_embed.push(embed);
        old_chunked_dex_count += chunked_dex[a].length;
    }

    for (i = 0; i < global_embed.length; i++) {
        if (total_pokemons_uncaught > 0) { global_embed[i].setDescription(`You have caught ${total_caught} out of ${dex_pokemons.length} ${description_string}pokemons.\n`); }
        else if (not_caught_count == 0) { global_embed[i].setDescription("You have caught all pokemons."); }
        else { global_embed[i].setDescription(`You have caught ${total_caught} out of ${dex_pokemons.length} ${description_string}pokemons.\n`); }
    }

    if (page > global_embed.length - 1 || page < 0) return interaction.reply({ content: 'No page found.', ephemeral: true });

    // Send message to channel.
    interaction.reply({ embeds: [global_embed[page]], fetchReply: true }).then(msg => {
        if (global_embed.length == 1) return;
        pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, global_embed, page);
    });
}

// Function to get evolve by move names.
function move_evolve(PokemonID) {

    if (PokemonID == "142") {
        var evolve_to = "685";
        var move_name = "Rollout";
    }
    else if (PokemonID == "148") {
        var evolve_to = "687";
        var move_name = "Ancient Power";
    }
    else if (PokemonID == "637") {
        var evolve_to = "218";
        var move_name = "Mimic";
    }
    else if (PokemonID == "636") {
        var evolve_to = "285";
        var move_name = "Mimic";
    }
    else if (PokemonID == "290") {
        var evolve_to = "622";
        var move_name = "Double Hit";
    }
    else if (PokemonID == "293") {
        var evolve_to = "714";
        var move_name = "Ancient Power";
    }
    else if (PokemonID == "345") {
        var evolve_to = "718";
        var move_name = "Ancient Power";
    }
    else if (PokemonID == "1290") {
        var evolve_to = "1291";
        var move_name = "Stomp";
    }
    else if (PokemonID == "1334") {
        var evolve_to = "1335";
        var move_name = "Dragon Pulse";
    }
    else if (PokemonID == "1511") {
        var evolve_to = "1512";
        var move_name = "Taunt";
    }
    else {
        return null;
    }
    return [evolve_to, move_name];
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

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

// Word search normalizer.
String.prototype._normalize = function () {
    return this.valueOf().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

module.exports.config = {
    name: "dex",
    description: "Shows the pokedex.",
    options: [{
        name: "cmd",
        description: "The command to use.",
        type: 3,
        min_length: 1
    }],
    aliases: []
}