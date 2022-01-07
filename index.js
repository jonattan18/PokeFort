// Imports
const Discord = require('discord.js');
const config = require("./config/config.json");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const { loadCommands } = require('./utils/loadCommands');
const mongoose = require('mongoose');
const fs = require('fs');

// Models
const guild_model = require('./models/guild')
const logger_model = require('./models/logger');
const channel_model = require('./models/channel');
const user_model = require('./models/user');

// Loading Pokemons Data
const pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());
const evolutions = JSON.parse(fs.readFileSync('./assets/evolutions.json').toString());
const mythical_pokemons = pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL");
const ultra_beast_pokemons = pokemons.filter(it => it["Primary Ability"] === "Beast Boost" && it["Alternate Form Name"] === "NULL");
const legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL");
const sub_legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL");
const gigantamax_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Gigantamax");
const mega_pokemons = pokemons.filter(it => it["Alternate Form Name"].includes("Mega"));
const galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar");
const alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola");
const normal_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL");

// Mongo Connect to DB
mongoose.connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

// Discord Client Login
client.login(config.BOT_TOKEN);
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

// Loading Commands
loadCommands(client);

client.on('message', async (message) => {
    if (message.author.bot) return;

    // Initialize Variables
    var prefix = config.DEFAULT_PREFIX;
    var user_available = false;

    // Message Processing
    var messageArray = message.content.split(' ');
    var cmd = messageArray[0].toLowerCase();
    var args = messageArray.slice(1);
    args = args.filter(function (e) { return e }); // Remove empty values from args

    //Getting Prefix from database
    await guild_model.findOne({ GuildID: message.guild.id }, (err, data) => {
        if (err) return console.log(err);
        if (!data) return;
        prefix = data.Prefix.toLowerCase();
    });

    //check if guild exists
    await guild_model.findOne({ GuildID: message.guild.id }, (err, guild) => {
        if (err) return console.log(err);
        // If guild not found create new one.
        if (!guild) {
            let write_data = new guild_model({
                GuildID: message.guild.id,
                GuildName: message.guild.name
            })
            write_data.save();
            logger(`Joined Guild. [ID: ${message.guild.id}] [Name: ${message.guild.name}]`)
        }
    });

    //Getting the data from the user model
    await user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (user) { user_available = true; }


        // Check if the message starts with the prefix.
        if (message.content.toLowerCase().startsWith(prefix)) {
            cmd = redirect_command(cmd, prefix);
            const commandfile = client.commands.get(cmd.slice(prefix.length)) || client.commands.get(client.aliases.get(cmd.slice(prefix.length)));
            if (!commandfile) return;
            commandfile.run(client, message, args, prefix, user_available, pokemons);
        }
        else {
            advance_xp(message, user_available); // Increase XP
        }
    });

    //#region Catch Sytem
    //check if database exists
    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) console.log(err);
        // If channel not found create new one.
        if (!channel) {
            let new_channel = new channel_model({
                ChannelID: message.channel.id,
                ChannelName: message.channel.name,
                MessageCount: 0,
                SpawnLimit: 0
            });
            new_channel.save();
            logger(`Joined Channel. [ID: ${message.guild.id}] [ChannelID: ${message.channel.id}] [ChannelName: ${message.channel.name}]`);
        }
        else {
            // Update message count
            (async () => {
                message.channel.messages.fetch({ limit: 2 }).then(messages => {
                    //[SPAM SYSTEM]
                    //     if (messages.last().author.id != message.author.id) {
                    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
                        let channel_id = message.channel.id;
                        var message_count = channel.MessageCount + 1;
                        var spawn_limit = channel.SpawnLimit;
                        if (spawn_limit == 0) {
                            spawn_limit = getRandomInt(10, 20);
                        }
                        if (spawn_limit == message_count) {
                            spawn_limit = 0;
                            message_count = 0;
                            spawn_pokemon(message, prefix); // Spawn Pokemon
                        }
                        channel_model.findOneAndUpdate({ ChannelID: channel_id }, { MessageCount: message_count, SpawnLimit: spawn_limit }, function (err, user) {
                            if (err) { console.log(err) }
                        });
                    });
                    //   }
                }).catch(console.error);
            })();
        }
    })
    //#endregion

    //#region Xp Increase
    //check if user database exists
    function advance_xp(message, user_avl) {
        if (user_avl) {
            user_model.findOne({ UserID: message.author.id }, (err, user) => {
                if (err) return console.log(err);
                if (user) {
                    // Update xp
                    (async () => {
                        message.channel.messages.fetch({ limit: 2 }).then(messages => {
                            var user_pokemons = user.Pokemons;
                            var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                            var _id = selected_pokemon._id;
                            var pokemon_id = selected_pokemon.PokemonId;
                            var pokemon_current_xp = selected_pokemon.Experience;
                            var pokemon_level = selected_pokemon.Level;
                            pokemon_current_xp += getRandomInt(1, 100);

                            if (pokemon_current_xp >= exp_to_level(pokemon_level)) {

                                // Get pokemon name from ID.
                                var pokemon_name = get_pokemon_name(pokemon_id, selected_pokemon);
                                var pokemon_name_bottom = get_pokemon_name(pokemon_id, selected_pokemon, true);
                                //Update level and send message.
                                pokemon_level += 1;
                                pokemon_current_xp = 0;

                                var embed = new Discord.MessageEmbed();
                                embed.addField(`Your ${pokemon_name} has levelled up!`, `${pokemon_name_bottom} is now level ${pokemon_level}!`, false);
                                embed.setColor("#1cb99a");

                                // Get pokemon evolution.
                                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
                                var pokemon_dex_number = pokemon_db["Pokedex Number"];
                                var pokemon_evolve = evolutions.filter(it => it["evolved_species_id"] == pokemon_dex_number + 1 && it["evolution_trigger_id"] == "Level")[0];
                                if (pokemon_evolve) {
                                    var pokemon_evolve_id = pokemon_evolve["evolved_species_id"];
                                    var pokemon_evolve_lvl = pokemon_evolve["minimum_level"];
                                    if (pokemon_level >= pokemon_evolve_lvl) {
                                        var new_pokemon_id = pokemons.filter(it => it["Pokedex Number"] == pokemon_evolve_id)[0]["Pokemon Id"];
                                        pokemon_id = new_pokemon_id;
                                        var new_pokemon_name = get_pokemon_name(new_pokemon_id, selected_pokemon, true);
                                        embed.addField(`What ? ${pokemon_name} is evolving!`, `Your ${pokemon_name_bottom} evolved into ${new_pokemon_name}`, false);
                                    }
                                }
                                message.channel.send(embed);
                            }

                            // Update database
                            user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons.$[el].Experience": pokemon_current_xp, "Pokemons.$[el].Level": pokemon_level, "Pokemons.$[el].PokemonId": pokemon_id } }, {
                                arrayFilters: [{ "el._id": _id }],
                                new: true
                            }, (err, user) => {
                                if (err) { console.log(err) }
                            });

                        }).catch(console.error);
                    })();
                }
            });
        }
    }

});

// Get pokemon name from pokemon ID.
function get_pokemon_name(pokemon_id, selected_pokemon, star_shiny = false) {
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
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
    if (selected_pokemon.Shiny) { if(star_shiny) { pokemon_name = ':star: ' + pokemon_name; } else { pokemon_name = 'Shiny ' + pokemon_name; } }
    return pokemon_name;
}

// Exp to level up.
function exp_to_level(level) {
    return 275 + (parseInt(level) * 25) - 25;
}

// New Guild Register
client.on('guildCreate', guild => {
    let write_data = new guild_model({
        GuildID: guild.id,
        GuildName: guild.name
    })
    write_data.save();
    logger(`Joined Guild. [ID: ${guild.id}] [Name: ${guild.name}]`)
    guild.systemChannel.send(config.BOT_NAME + " Joined this server. Thanks for invitation :smile:")
    guild.systemChannel.send("Use ``" + config.DEFAULT_PREFIX + "help`` to view list of commands.")
});

// Redirect Command
function redirect_command(command, prefix) {
    // Commands to redirect
    command = command.slice(prefix.length);
    var redirect_list = [["n", "next"], ["bal", "balance"], ["b", "back"], ["i", "info"], ["pk", "pokemon"]];
    redirect_list = redirect_list.filter(it => it[0] == command);
    if (redirect_list.length > 0) {
        var index = redirect_list.findIndex(it => it[0] == command);
        return prefix + redirect_list[index][1];
    } else { return prefix + command; }
}

// Pokemon Spawn System
function spawn_pokemon(message, prefix) {

    // Initialize Variables
    let random = getRandomInt(0, 1000);
    var spawn_pokemon = "";
    var form = "";
    var is_shiny = false;
    var spawn_legendary_type = legendary_pokemons.concat(sub_legendary_pokemons).concat(mythical_pokemons).concat(ultra_beast_pokemons);
    // To Spawn Legendary type.
    if (random > 995) {
        let random_legendary = getRandomInt(0, spawn_legendary_type.length);
        spawn_pokemon = spawn_legendary_type[random_legendary];
        if (shiny_random = getRandomInt(0, 1000) > 970) {
            is_shiny = true;
        }
    }
    // To Spawn Galarian
    else if (random > 990) {
        let random_galarian = getRandomInt(0, galarian_pokemons.length);
        spawn_pokemon = galarian_pokemons[random_galarian];
        if (shiny_random = getRandomInt(0, 1000) > 970) {
            is_shiny = true;
        }
    }
    // To Spawn Alolan
    else if (random > 985) {
        let random_alolan = getRandomInt(0, alolan_pokemons.length);
        spawn_pokemon = alolan_pokemons[random_alolan];
        if (shiny_random = getRandomInt(0, 1000) > 970) {
            is_shiny = true;
        }
    }
    // To Spawn Normal
    else {
        let random_normal_pokemon = getRandomInt(0, normal_pokemons.length);
        spawn_pokemon = normal_pokemons[random_normal_pokemon];
        if (shiny_random = getRandomInt(0, 1000) > 970) {
            is_shiny = true;
        }
    }

    // Pokemon Level
    let random_level = getRandomInt(1, 36);

    // Image url
    var str = "" + spawn_pokemon["Pokedex Number"];
    var form = spawn_pokemon["Alternate Form Name"];
    var pad = "000"
    var pokedex_num = pad.substring(0, pad.length - str.length) + str;
    if (form == "" || form == "NULL") { var image_name = pokedex_num + '.png'; }
    else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
    var image_url = './assets/images/' + image_name;

    // Pokemon Nature
    let random_nature = getRandomInt(1, 26);

    // IV creation
    var IV = [];
    while (true) {
        let hp_iv = getRandomInt(0, 31);
        let atk_iv = getRandomInt(0, 31);
        let def_iv = getRandomInt(0, 31);
        let spa_iv = getRandomInt(0, 31);
        let spd_iv = getRandomInt(0, 31);
        let spe_iv = getRandomInt(0, 31);
        let total_iv = (hp_iv + atk_iv + def_iv + spa_iv + spd_iv + spe_iv / 186 * 100).toFixed(2);
        IV = [hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv];
        if (total_iv > 90 || total_iv < 10) { if (getRandomInt(0, 1000) > 990) { continue; } else { break; } }
        break;
    }

    // Create embed message
    let embed = new Discord.MessageEmbed();
    embed.attachFiles(image_url)
    embed.setImage('attachment://' + image_name)
    embed.setTitle("A wild pokémon has appeared!")
    embed.setDescription(`Guess the pokémon and type ${prefix}catch <pokémon> to catch it!`)
    embed.setColor("#1cb99a");
    message.channel.send(embed);

    // Updating pokemon to database.
    channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { PokemonID: spawn_pokemon["Pokemon Id"], PokemonLevel: random_level, Shiny: is_shiny, Hint: 0, PokemonNature: random_nature, PokemonIV: IV }, function (err, user) {
        if (err) { console.log(err) }
    });
}

// Logging System
function logger(Message) {
    let write_data = new logger_model({
        Message: Message
    })
    write_data.save();
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}