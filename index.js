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
const market_model = require('./models/market');
const auction_model = require('./models/auction');

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

// Market Initialization
market_model.findOne({ Primary: true }, (err, market) => {
    if (err) console.log(err);
    if (!market) {
        var market = new market_model({
            Primary: true,
            Last_Unique_Value: 0
        });
        market.save();
    }
});

// Auction Initialization
auction_model.findOne({ Primary: true }, (err, auction) => {
    if (err) console.log(err);
    if (!auction) {
        var auction = new auction_model({
            Primary: true,
            Last_Unique_Value: 0
        });
        auction.save();
    }
});

client.on('message', async (message) => {
    if (message.author.bot) return;

    // Remove this
    if (!config.ALLOWED_GUILDS.includes(message.guild.id)) return;

    if (message.guild === null ) return message.author.send("This bot don't support DM at the moment.");

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
            //   if (channel_message_cache[message.channel.id] != message.author.id && config.SPAWN_SPAM_SYSTEM) {

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
            //   }
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
            advance_xp(message, user_available, user); // Increase XP
        }
    });

    //#region Xp Increase
    //check if user database exists
    function advance_xp(message, user_avl, user) {
        if (user_avl) {
            if (channel_data != null && channel_data.Disabled === true) return;
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {

                var randomxp = getRandomInt(1, 100);

                // Check for XP Boosters.
                if (user.Boosters != undefined) {
                    var old_date = user.Boosters.Timestamp;
                    var new_date = new Date();
                    var hours = Math.abs(old_date - new_date) / 36e5;
                    if (hours < user.Boosters.Hours) { randomxp *= user.Boosters.Level; }
                }

                //#region Update XP
                var selected_pokemon = user_pokemons.filter(it => it._id == global_user.Selected)[0];
                var _id = selected_pokemon._id;
                var pokemon_id = selected_pokemon.PokemonId;
                var pokemon_current_xp = selected_pokemon.Experience + randomxp
                var pokemon_level = selected_pokemon.Level;
                if (pokemon_level == 100 || pokemon_level > 100) return;
                if (selected_pokemon.Held == "Xp blocker") return;
                var old_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, load_pokemons, selected_pokemon.Shiny);
                var old_pokemon_name_star = getPokemons.get_pokemon_name_from_id(pokemon_id, load_pokemons, selected_pokemon.Shiny, true);

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

                        if (selected_pokemon.Held != "Everstone") {
                            // Get pokemon evolution.
                            var pokemon_data = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
                            //Exections for Tyrogue
                            if (pokemon_id == "360" && pokemon_level >= 20) {
                                var ev = 0;
                                let atk = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[1] + _.floor(0.25 * ev)) * pokemon_level) + 5);
                                let def = (_.floor(0.01 * (2 * 35 + selected_pokemon.IV[2] + _.floor(0.25 * ev)) * pokemon_level) + 5);

                                if (atk > def) pokemon_id = "140";
                                else if (atk < def) pokemon_id = "141";
                                else pokemon_id = "361";
                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                                evolved = true;
                                new_evolved_name = new_pokemon_name;

                            }
                            //Exception for Cosmoem
                            else if (pokemon_id == "1320" && pokemon_level >= 53) {
                                if (message.channel.name == "day") { evolved = true; pokemon_id = "1321"; }
                                else if (message.channel.name == "night") { evolved = true; pokemon_id = "1322"; }

                                if (evolved) {
                                    var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_id, pokemons, selected_pokemon.Shiny);
                                    pokemon_id = pokemon_id;
                                    new_evolved_name = new_pokemon_name;
                                }
                            }
                            else {
                                if (pokemon_data.Evolution != "NULL" && pokemon_data.Evolution.Reason == "Level") {
                                    if (pokemon_level >= pokemon_data.Evolution.Level) {
                                        if (pokemon_data.Evolution.Time == undefined || (pokemon_data.Evolution.Time != undefined && pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase())) {

                                            // Double evolution check.
                                            var double_pokemon_data = load_pokemons.filter(it => it["Pokemon Id"] == pokemon_data.Evolution.Id)[0];

                                            if ((double_pokemon_data.Evolution != "NULL" && double_pokemon_data.Evolution.Reason == "Level" && pokemon_level >= double_pokemon_data.Evolution.Level) && (double_pokemon_data.Evolution.Time == undefined || (double_pokemon_data.Evolution.Time != undefined && double_pokemon_data.Evolution.Time.toLowerCase() == message.channel.name.toLowerCase()))) {
                                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(double_pokemon_data.Evolution.Id, load_pokemons, selected_pokemon.Shiny);
                                                pokemon_id = double_pokemon_data.Evolution.Id;
                                            }
                                            else {
                                                var new_pokemon_name = getPokemons.get_pokemon_name_from_id(pokemon_data.Evolution.Id, load_pokemons, selected_pokemon.Shiny);
                                                pokemon_id = pokemon_data.Evolution.Id;
                                            }
                                            evolved = true;
                                            new_evolved_name = new_pokemon_name;
                                        }
                                    }
                                }
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

                if (channel_data != null && channel_data.Silence === true) return;
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
    var redirect_list = [["n", "next"], ["bal", "balance"], ["b", "back"], ["i", "info"], ["pk", "pokemon"], ["mi", "moveinfo"], ["addfav", "addfavourite"], ["removefav", "removefavourite"], ["fav", "favourite"], ["pf", "profile"], ["tms", "tmmoves"], ["m", "market"], ["auc", "auction"], ["mails", "mail"]];
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
        if (shiny_random = getRandomInt(0, 1000) > 990) {
            is_shiny = true;
        }
    }
    // To Spawn Galarian
    else if (random > 990) {
        let random_galarian = getRandomInt(0, galarian_pokemons.length);
        spawn_pokemon = galarian_pokemons[random_galarian];
        if (shiny_random = getRandomInt(0, 1000) > 990) {
            is_shiny = true;
        }
    }
    // To Spawn Alolan
    else if (random > 985) {
        let random_alolan = getRandomInt(0, alolan_pokemons.length);
        spawn_pokemon = alolan_pokemons[random_alolan];
        if (shiny_random = getRandomInt(0, 1000) > 990) {
            is_shiny = true;
        }
    }
    // To Spawn Normal
    else {
        // To not to spawn new pokemons arceus... Remove me
        let random_normal_pokemon = getRandomInt(0, normal_pokemons.length - 7);
        spawn_pokemon = normal_pokemons[random_normal_pokemon];
        if (shiny_random = getRandomInt(0, 1000) > 990) {
            if (getRandomInt(0, 1000) > 980) {
                is_shiny = true;
            }
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
    var msg_id = "";
    client.channels.fetch(channel_to_send).then(channel => { channel.send(embed).then(message => { msg_id = message.id; }); });
    channel_model.findOneAndUpdate({ ChannelID: channel_to_send }, { PokemonID: spawn_pokemon["Pokemon Id"], PokemonLevel: random_level, Shiny: is_shiny, Hint: 0, PokemonNature: random_nature, PokemonIV: IV, MessageID: msg_id }, function (err, user) {
        if (err) { console.log(err) }
    });
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}