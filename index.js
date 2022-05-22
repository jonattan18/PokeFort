// Imports
const Discord = require('discord.js');
const config = require("./config/config.json");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const mongoose = require('mongoose');
const fs = require('fs');

// Models
const guild_model = require('./models/guild')
const channel_model = require('./models/channel');
const user_model = require('./models/user');
const pokemons_model = require('./models/pokemons');

//Utils
const { loadCommands } = require('./utils/loadCommands');
const getPokemons = require('./utils/getPokemon');
const admin = require('./utils/admin');

// Loading Pokemons Data
const pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());
const mythical_pokemons = pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL");
const ultra_beast_pokemons = pokemons.filter(it => it["Primary Ability"] === "Beast Boost" && it["Alternate Form Name"] === "NULL");
const legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL");
const sub_legendary_pokemons = pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL");
const gigantamax_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Gigantamax");
const mega_pokemons = pokemons.filter(it => it["Alternate Form Name"].includes("Mega"));
const galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar");
const alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola");
const normal_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL");

// Channel
channel_message_cache = {};

// Mongo Connect to DB
mongoose.connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});

// Discord Client Login
client.login(config.BOT_TOKEN);
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

// Loading Commands
loadCommands(client);

client.on('message', async (message) => {
    if (message.author.bot) return;

    // Loading Pokemons Data
    var load_pokemons = JSON.parse(fs.readFileSync('./assets/pokemons.json').toString());

    // Initialize Variables
    var prefix = config.DEFAULT_PREFIX;
    var user_available = false;
    var global_user = null;
    var guild_redirect_spawn = null;
    var channel_data = null;

    // Message Processing
    var messageArray = message.content.split(' ');
    var cmd = messageArray[0].toLowerCase();
    var args = messageArray.slice(1);
    args = args.filter(function (e) { return e }); // Remove empty values from args

    //Getting Prefix from database
    await guild_model.findOne({ GuildID: message.guild.id }, (err, guild) => {
        if (err) return console.log(err);
        if (!guild) {
            let write_data = new guild_model({
                GuildID: message.guild.id,
                GuildName: message.guild.name
            })
            write_data.save();
        }
        else prefix = guild.Prefix.toLowerCase();
        if (guild != null && guild["Redirect"] !== undefined) { guild_redirect_spawn = guild.Redirect; }
    });

    //#region Catch Sytem
    //check if database exists
    await channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) console.log(err);
        channel_data = channel;
        if (channel && channel.Disabled === true) return;
        // If channel not found create new one.
        if (!channel) {
            let new_channel = new channel_model({
                ChannelID: message.channel.id,
                ChannelName: message.channel.name,
                MessageCount: 0,
                SpawnLimit: 0
            });
            new_channel.save();
        }
        else {
            // Update message count
            // [SPAM SYSTEM]
            if (channel_message_cache[message.channel.id] != message.author.id && config.SPAWN_SPAM_SYSTEM) {

                //Caching last message user.
                channel_message_cache[message.channel.id] = message.author.id;
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
                        spawn_pokemon(message, prefix, guild_redirect_spawn); // Spawn Pokemon
                    }

                    channel_model.findOneAndUpdate({ ChannelID: channel_id }, { MessageCount: message_count, SpawnLimit: spawn_limit }, function (err, user) {
                        if (err) { console.log(err) }
                    });
                });
            }
        }
    });
    //#endregion

    //Getting the data from the user model
    await user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (user) { user_available = true; }
        global_user = user; // To access from outer fields.
        var issuspend = false; // To check if the user is suspended

        // Suspend Protection
        if (user != null && user.Suspend.Hours != undefined) {
            if ((Date.now() - user.Suspend.Timestamp) / 1000 > (user.Suspend.Hours * 3600)) {
                user.Suspend = undefined;
                user.save();
            }
            else issuspend = true;
        }

        // Check if the message starts with the prefix.
        if (message.content.toLowerCase().startsWith(prefix)) {
            if (issuspend) return message.channel.send(`You have been suspended for ${user.Suspend.Hours} hours. Reason: ${user.Suspend.Reason}`);
            cmd = redirect_command(cmd, prefix).slice(prefix.length);
            if (channel_data != null && channel_data.Disabled === true && cmd.toLocaleLowerCase() != 'channel') return;
            if (user != null && admin.iseligible(user.Admin, cmd, message)) { message.isadmin = true; message.Adminlvl = user.Admin; }
            const commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
            if (!commandfile) return;
            commandfile.run(client, message, args, prefix, user_available, load_pokemons);
        }
        else {
            if (issuspend) return;
            advance_xp(message, user_available); // Increase XP
        }
    });

    //#region Xp Increase
    //check if user database exists
    function advance_xp(message, user_avl) {
        if (user_avl) {
            if (channel_data != null && channel_data.Disabled === true) return;
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                //#region Update XP
                var selected_pokemon = user_pokemons.filter(it => it._id == global_user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_id = selected_pokemon.PokemonId;
                var pokemon_current_xp = selected_pokemon.Experience + getRandomInt(1, 100);
                var pokemon_level = selected_pokemon.Level;
                var old_pokemon_name = get_pokemon_name(load_pokemons, pokemon_id, selected_pokemon);
                var old_pokemon_name_star = get_pokemon_name(load_pokemons, pokemon_id, selected_pokemon, true);

                var old_pokemon_exp = pokemon_current_xp;
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
                        var evo_tree = evolution_tree(load_pokemons, pokemon_id);
                        var next_evolutions = evo_tree.filter(it => it[0] > pokemon_id && it[1].includes('Level'));
                        if (next_evolutions != undefined && next_evolutions.length > 0) {
                            next_evolutions = next_evolutions[0];
                            var required_level = next_evolutions[1].match(/\d/g).join("");
                            if (pokemon_level >= required_level) {
                                var new_pokemon_name = get_pokemon_name(load_pokemons, next_evolutions[0], selected_pokemon);
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
                if (pokemon_current_xp < 0) pokemon_current_xp = 0;
                // Update database
                pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Experience": pokemon_current_xp, "Pokemons.$[elem].Level": pokemon_level, "Pokemons.$[elem].PokemonId": pokemon_id } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                    if (err) return console.log(err);
                });
                //#endregion

                if (leveled_up || evolved) {
                    var embed = new Discord.MessageEmbed()
                }

                if (global_user.Silence == false || global_user.Silence == undefined) {
                    if (leveled_up) { embed.addField(`Your ${old_pokemon_name} has levelled up!`, `${old_pokemon_name_star} is now level ${pokemon_level}!`, false); }
                    if (evolved) { embed.addField(`What ? ${old_pokemon_name} is evolving!`, `Your ${old_pokemon_name} evolved into ${new_evolved_name}`, false); }
                    if (evolved || leveled_up) {
                        message.channel.send(embed);
                    }
                }

            });
        }
    }
    //#endregion
});

// Get pokemon name from pokemon ID.
function get_pokemon_name(load_pokemons, pokemon_id, selected_pokemon, star_shiny = false) {
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
    if (selected_pokemon.Shiny) { if (star_shiny) { pokemon_name = ':star: ' + pokemon_name; } else { pokemon_name = 'Shiny ' + pokemon_name; } }
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
    guild.systemChannel.send(config.BOT_NAME + " Joined this server. Thanks for invitation :smile:")
    guild.systemChannel.send("Use ``" + config.DEFAULT_PREFIX + "help`` to view list of commands.")
});

// Redirect Command
function redirect_command(command, prefix) {
    // Commands to redirect
    command = command.slice(prefix.length);
    var redirect_list = [["n", "next"], ["bal", "balance"], ["b", "back"], ["i", "info"], ["pk", "pokemon"], ["m", "moves"], ["mi", "moveinfo"], ["addfav", "addfavourite"], ["removefav", "removefavourite"], ["fav", "favourite"], ["pf", "profile"], ["tms", "tmmoves"]];
    redirect_list = redirect_list.filter(it => it[0] == command);
    if (redirect_list.length > 0) {
        var index = redirect_list.findIndex(it => it[0] == command);
        return prefix + redirect_list[index][1];
    } else { return prefix + command; }
}

// Pokemon Spawn System
function spawn_pokemon(message, prefix, guild_redirect_spawn) {

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
        let hp_iv = getRandomInt(0, 32);
        let atk_iv = getRandomInt(0, 32);
        let def_iv = getRandomInt(0, 32);
        let spa_iv = getRandomInt(0, 32);
        let spd_iv = getRandomInt(0, 32);
        let spe_iv = getRandomInt(0, 32);
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

    // Updating pokemon to database.
    var channel_to_send = guild_redirect_spawn == null ? message.channel.id : guild_redirect_spawn;
    client.channels.fetch(channel_to_send).then(channel => { channel.send(embed) });
    channel_model.findOneAndUpdate({ ChannelID: channel_to_send }, { PokemonID: spawn_pokemon["Pokemon Id"], PokemonLevel: random_level, Shiny: is_shiny, Hint: 0, PokemonNature: random_nature, PokemonIV: IV }, function (err, user) {
        if (err) { console.log(err) }
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

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}