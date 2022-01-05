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
const { floor } = require('lodash');

/*
HP_IV = 22;
Atk_IV = 17;
level = 1;
hp_base = 70;
atk_base = 85;
EV = 0;
var hp = floor(0.01 * (2 * hp_base + HP_IV + floor(0.25 * EV)) * level) + level + 10
console.log(hp);
var atk = (floor(0.01 * (2 * atk_base + Atk_IV + floor(0.25 * EV)) * level) + 5);
console.log(atk);
//var atk = floor(0.01 * (2 * base + IV + floor(0.25 * EV)) * level) + 5;
//console.log((percent/100 * stat).toFixed(2));
*/

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
        if (!user) return;
        user_available = true;
    });

    // Check if the message starts with the prefix.
    if (message.content.toLowerCase().startsWith(prefix)) {
        cmd = redirect_command(cmd, prefix);
        const commandfile = client.commands.get(cmd.slice(prefix.length)) || client.commands.get(client.aliases.get(cmd.slice(prefix.length)));
        if (!commandfile) return;
        commandfile.run(client, message, args, prefix, user_available, pokemons);
    }

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
                    if (messages.last().author.id != message.author.id) {
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
                    }
                }).catch(console.error);
            })();
        }
        //#endregion
    })
});

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
    var redirect_list = [["n", "next"], ["bal", "balance"], ["b", "back"]];
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