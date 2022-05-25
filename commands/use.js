const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash');
const fs = require('fs');

// Get moveinfo.
const moveinfo = JSON.parse(fs.readFileSync('./assets/movesinfo.json').toString());

// Models
const prompt_model = require('../models/prompt');
const pokemons_model = require('../models/pokemons');
const user_model = require('../models/user');

// Utils
const battle = require('../utils/battle');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (isInt(args[0]) == false) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }
    if (args[0] > 4 || args[0] < 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to duel.`); }

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": message.author.id }, { "UserID.User2ID": message.author.id }] }, { "ChannelID": message.channel.id }, { "Duel.Accepted": true }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('You are not in a duel!');

        var duel_data = prompt.Duel;
        var user1_data = duel_data.User1Pokemon;
        var user2_data = duel_data.User2Pokemon;

        // Player 1
        if (prompt.UserID.User1ID == message.author.id) {
            if (duel_data.Turn != 1) return message.channel.send('It is not your turn!');
            var user_1_pokemon = pokemons.filter(it => it["Pokemon Id"] == user1_data.PokemonID)[0];
            var user_2_pokemon = pokemons.filter(it => it["Pokemon Id"] == user2_data.PokemonID)[0];
            var move_used = user1_data.Moves[args[0] - 1].replace(/ /g, "").replace(/[^a-zA-Z ]/g, "").toLowerCase();
            var move_used_info = moveinfo[move_used];
            var pokemon_level = user1_data.PokemonLevel;
            var damage = battle.calculate_damage(user_1_pokemon, user1_data.Attack, user2_data.Defense, pokemon_level, move_used_info, user_2_pokemon);

            prompt.Duel.User2Pokemon.ActiveHP -= damage[0];
            message.delete().then(() => {
                prompt.Duel.User1Move = [damage[0], damage[1], move_used_info.name];
                prompt.Duel.Turn = 2;
                prompt.save();
            });

        }

        // Player 2
        if (prompt.UserID.User2ID == message.author.id) {
            if (duel_data.Turn != 2) return message.channel.send('It is not your turn!');
            var user_1_pokemon = pokemons.filter(it => it["Pokemon Id"] == user1_data.PokemonID)[0];
            var user_2_pokemon = pokemons.filter(it => it["Pokemon Id"] == user2_data.PokemonID)[0];
            var move_used = user2_data.Moves[args[0] - 1].replace(/ /g, "").replace(/[^a-zA-Z ]/g, "").toLowerCase();
            var move_used_info = moveinfo[move_used];
            var pokemon_level = user2_data.PokemonLevel;
            var description = "";
            var damage = battle.calculate_damage(user_2_pokemon, user2_data.Attack, user1_data.Defense, pokemon_level, move_used_info, user_1_pokemon);
            prompt.Duel.User1Pokemon.ActiveHP -= damage[0];

            // Create embed for damage.
            var embed = new Discord.MessageEmbed()
            embed.setTitle(`${duel_data.User1name} VS ${duel_data.User2name}`)
            embed.setColor(message.guild.me.displayHexColor);

            if (prompt.Duel.User2Pokemon.ActiveHP <= 0) {
                // Xp gained calculations.
                var xp = battle.xp_calculation(user_1_pokemon, user1_data.PokemonLevel, user_2_pokemon, user2_data.PokemonLevel, user1_data.Traded, false);
                // Description generation.
                description += `\n${duel_data.User1name}'s ${user1_data.PokemonName} used ${duel_data.User1Move[2]}!`;
                description += `\n${duel_data.User1Move[1]} **-${duel_data.User1Move[0]}**\n`;
                description += `\n${duel_data.User2name}'s ${user2_data.PokemonName} used ${move_used_info.name}!`;
                description += `\n${damage[1]} **-${damage[0]}**\n`;
                description += `\n${duel_data.User2name}'s ${user2_data.PokemonName} has fainted!`;
                description += `**\n${duel_data.User1name} wins!**`;
                description += `\n${duel_data.User1name} was awarded ${xp}XP and 10 credits for winning! :moneybag:`;
                prompt.remove().then(() => {
                    user_model.findOneAndUpdate({ "UserID": prompt.UserID.User1ID }, { $inc: { PokeCredits: 10, TotalDueled: 1, DuelWon: 1 } }, (err, user) => {
                        pokemon_xp_update(user1_data.PokemonUserID, user1_data.PokemonID, parseInt(user1_data.PokemonXP) + parseInt(xp), user1_data.PokemonLevel, user1_data.PokemonName, user1_data.Shiny);
                    });
                });
            }
            else if (prompt.Duel.User1Pokemon.ActiveHP <= 0) {
                // Xp gained calculations.
                var xp = battle.xp_calculation(user_2_pokemon, user2_data.PokemonLevel, user_1_pokemon, user1_data.PokemonLevel, user2_data.Traded, false);
                // Description generation.
                description += `\n${duel_data.User1name}'s ${user1_data.PokemonName} used ${duel_data.User1Move[2]}!`;
                description += `\n${duel_data.User1Move[1]} **-${duel_data.User1Move[0]}**\n`;
                description += `\n${duel_data.User2name}'s ${user2_data.PokemonName} used ${move_used_info.name}!`;
                description += `\n${damage[1]} **-${damage[0]}**\n`;
                description += `\n${duel_data.User1name}'s ${user1_data.PokemonName} has fainted!`;
                description += `**\n${duel_data.User2name} wins!**`;
                description += `\n${duel_data.User2name} was awarded ${xp}XP and 10 credits for winning! :moneybag:`;
                prompt.remove().then(() => {
                    user_model.findOneAndUpdate({ "UserID": prompt.UserID.User2ID }, { $inc: { PokeCredits: 10, TotalDueled: 1, DuelWon: 1 } }, (err, user) => {
                        pokemon_xp_update(user2_data.PokemonUserID, user2_data.PokemonID, parseInt(user2_data.PokemonXP) + parseInt(xp), user2_data.PokemonLevel, user2_data.PokemonName, user2_data.Shiny);
                    });
                });
            }
            else {
                description = `${duel_data.User1name}'s ${user1_data.PokemonName}: ${prompt.Duel.User1Pokemon.ActiveHP}/${user1_data.TotalHP}HP\n${duel_data.User2name}'s ${user2_data.PokemonName}: ${prompt.Duel.User2Pokemon.ActiveHP}/${user2_data.TotalHP}HP\n`;
                const img_buffer = new Buffer.from(prompt.Duel.ImageCache, 'base64');
                const image_file = new Discord.MessageAttachment(img_buffer, 'img.jpeg');
                embed.attachFiles(image_file)
                embed.setImage('attachment://img.jpeg')
                description += `\n${duel_data.User1name}'s ${user1_data.PokemonName} used ${duel_data.User1Move[2]}!`;
                description += `\n${duel_data.User1Move[1]} **-${duel_data.User1Move[0]}**\n`;
                description += `\n${duel_data.User2name}'s ${user2_data.PokemonName} used ${move_used_info.name}!`;
                description += `\n${damage[1]} **-${damage[0]}**`;
                prompt.Duel.Turn = 1;
                prompt.save();
            }

            embed.setDescription(description);
            message.channel.send(embed).then(() => {
                message.delete();
            });
        }

        //#region Pokemon XP Update.
        function pokemon_xp_update(_id, pokemon_id, pokemon_current_xp, pokemon_level, old_pokemon_name, shiny) {
            if (pokemon_level == 100) return;
            var leveled_up = false;
            var evolved = false;
            var new_evolved_name = "";
            while (pokemon_current_xp > 0) {
                if (pokemon_current_xp >= exp_to_level(pokemon_level)) {
                    leveled_up = true;

                    //Update level and send message.
                    pokemon_level += 1;
                    pokemon_current_xp -= exp_to_level(pokemon_level);

                    if (pokemon_level == 100) {
                        pokemon_level = 100;
                        pokemon_current_xp = 0;
                        break;
                    }

                    // Get pokemon evolution.
                    var evo_tree = evolution_tree(pokemons, pokemon_id);
                    var next_evolutions = evo_tree.filter(it => it[0] > pokemon_id && it[1].includes('Level'));
                    if (next_evolutions != undefined && next_evolutions.length > 0) {
                        next_evolutions = next_evolutions[0];
                        var required_level = next_evolutions[1].match(/\d/g).join("");
                        if (pokemon_level >= required_level) {
                            var new_pokemon_name = get_pokemon_name(pokemons, next_evolutions[0], shiny, true);
                            pokemon_id = next_evolutions[0];
                            evolved = true;
                            new_evolved_name = new_pokemon_name;
                        }
                    }
                }
                else {
                    break;
                }
            }

            // Update database
            pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Experience": pokemon_current_xp, "Pokemons.$[elem].Level": pokemon_level, "Pokemons.$[elem].PokemonId": pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                if (err) return console.log(err);
            });

            // Send Update Note
            var embed = new Discord.MessageEmbed()
            if (evolved) { embed.addField(`**${old_pokemon_name} evolved to ${new_evolved_name}!**`, `${new_evolved_name} is now level ${pokemon_level}`, false); }
            else if (leveled_up) { embed.addField(`**${old_pokemon_name} levelled up!**`, `${old_pokemon_name} is now level ${pokemon_level}`, false); }
            embed.setColor(message.member.displayHexColor)
            if (evolved || leveled_up) message.channel.send(embed);

        }
        //#endregion
    });
}

// Get evolution tree of pokemons.
function evolution_tree(pokemons, pokemon_id) {
    var filtered_pokemons = [];
    var found_pokemon = pokemons.filter(pokemon => pokemon["Pokemon Id"] == pokemon_id)[0];
    if (found_pokemon == undefined) { return error[1] = [false, "Invalid pokemon name."] }
    filtered_pokemons.push(parseInt(found_pokemon["Pokemon Id"]));

    var pre_evolution = pokemons.filter(it => it["Pokemon Id"] === found_pokemon["Pre-Evolution Pokemon Id"].toString())[0];
    if (pre_evolution) filtered_pokemons.push([parseInt(pre_evolution["Pokemon Id"]), pre_evolution["Evolution Details"]]);

    var pre_pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(found_pokemon["Pokemon Id"]))[0];
    if (pre_pre_evolution) filtered_pokemons.push([parseInt(pre_pre_evolution["Pokemon Id"]), pre_pre_evolution["Evolution Details"]]);

    if (pre_evolution) var post_evolution = pokemons.filter(it => it["Pokemon Id"] === pre_evolution["Pre-Evolution Pokemon Id"].toString())[0];
    if (post_evolution) filtered_pokemons.push([parseInt(post_evolution["Pokemon Id"]), post_evolution["Evolution Details"]]);

    if (pre_pre_evolution) var post_post_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pre_pre_evolution["Pokemon Id"]))[0];
    if (post_post_evolution) filtered_pokemons.push([parseInt(post_post_evolution["Pokemon Id"]), post_post_evolution["Evolution Details"]]);

    return filtered_pokemons;
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(load_pokemons, pokemon_id, shiny, star_shiny = false) {
    var pokemon_db = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
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
    if (shiny) { if (star_shiny) { pokemon_name = ':star: ' + pokemon_name; } else { pokemon_name = 'Shiny ' + pokemon_name; } }
    return pokemon_name;
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
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

module.exports.config = {
    name: "use",
    aliases: []
}
