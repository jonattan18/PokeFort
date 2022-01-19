const Discord = require('discord.js'); // For Embedded Message.
const _ = require('lodash'); // Array sorting module.

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');

// Initialize the variable.
var pokemons_from_database = [];

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    // Get all user pokemons.
    getPokemons.getallpokemon(message.author.id).then(data => {
        pokemons_from_database = data;

        //Check if its dex arguements
        if (args.length == 0 || isInt(args[0])) { dex_pokemons(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--rewards") { rewards(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "claim" && args[1] == "all") { claim_all(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "claim" && args[1] != "all") { claim(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--ub" || args[0] == "--ultrabeast") { dex_ultrabeast(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--l" || args[0] == "--legendary") { dex_legendary(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--m" || args[0] == "--mythical") { dex_mythical(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--a" || args[0] == "--alolan") { dex_alolan(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--g" || args[0] == "--galarian") { dex_galarian(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--gen" || args[0] == "--generation" && isInt(args[1])) { dex_generation(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--t" || args[0] == "--type" && args[1] != undefined) { dex_type(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--n" || args[0] == "--name" && args[1] != undefined) { dex_name(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--p" || args[0] == "--pseudo") { dex_pseudo(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--s" || args[0] == "--starter") { dex_starter(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--c" || args[0] == "--caught") { dex_caught(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--uc" || args[0] == "--uncaught") { dex_uncaught(bot, message, args, prefix, user_available, pokemons); return; }
        if (args[0] == "--od" || args[0] == "--orderd") { dex_orderd(bot, message, args, prefix, user_available, pokemons); return; }

        // Forms
        var isshiny = false;
        var form = [];
        if (args[0].toLowerCase() == "shiny") { form.push("Shiny"); args.splice(0, 1); if (args[0] == undefined) { message.channel.send("That is not a valid pokemon!"); return; } }
        if (args[0].toLowerCase() == "alolan") { form.push("Alola"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "galarian") { form.push("Galar"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "gigantamax") { form.push("Gigantamax"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "eternamax") { form.push("Eternamax"); args.splice(0, 1) }
        else if (args[0].toLowerCase() == "mega" && args[args.length - 1].toLowerCase() == "x" || args[args.length - 1].toLowerCase() == "y") {
            if (args[args.length - 1] == "x") { form.push("Mega X") };
            if (args[args.length - 1] == "y") { form.push("Mega Y") };
            args.splice(0, 1);
            args.splice(args.length - 1, 1)
        }
        else if (args[0].toLowerCase() == "mega") { form.push("Mega"); args.splice(0, 1) }

        if (form.length == 1) { form = form[0] }
        else if (form.length == 2) { form = form[1]; isshiny = true; }

        let given_name = args.join(" ")._normalize();

        if (form == "" || form == "Shiny") {
            var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name); // Searching in English Name.
            if (pokemon.length == 0) {
                dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name); // Searching in Germany Name.
                jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name)); // Searching in Japanese Name.
                fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name); // Searching in French Name.
                if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) { message.channel.send("That is not a valid pokemon!"); return; };
            }
        }
        else {
            var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in English Name.
            if (pokemon.length == 0) {
                dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in Germany Name.
                jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name) && it["Alternate Form Name"] === form); // Searching in Japanese Name.
                fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in French Name.
                if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) { message.channel.send("That is not a valid pokemon!"); return; };
            }
        }

        function language_finder(dr_pokemon, jp_pokemon, fr_pokemon) {
            if (dr_pokemon.length > 0) { pokemon = dr_pokemon; }
            else if (jp_pokemon.length > 0) { pokemon = jp_pokemon; }
            else if (fr_pokemon.length > 0) { pokemon = fr_pokemon; }
            else { return false; }
        }

        pokemon = pokemon[0];

        // No of caught
        //Getting the data from the user model
        var no_of_caught = 0;
        // Get number of catached pokemons.
        var user_pokemons = pokemons_from_database
        no_of_caught = user_pokemons.filter(it => it["PokemonId"] === parseInt(pokemon["Pokemon Id"]) && it["Reason"] === "Catched").length;
        create_embed();

        //#region Create Message

        // Pokemon Name
        if (form == "") { var pokemon_name = pokemon["Pokemon Name"] }
        else if (form == "Mega X" || form == "Mega Y") {
            var pokemon_name = `Mega ${pokemon["Pokemon Name"]} ${form[form.length - 1]}`
        }
        else {
            var form_name = "";
            if (form == "Shiny") { form_name = "" }
            else if (form == "Alola") { form_name = "Alolan" }
            else if (form == "Galar") { form_name = "Galarian" }
            else { form_name = form; }
            var pokemon_name = `${form_name} ${pokemon["Pokemon Name"]}`;
        }

        // Evolution
        var evolution = "";
        var type = "";
        var pre_evolution = pokemons.filter(it => it["Pre-Evolution Pokemon Id"] === parseInt(pokemon["Pokemon Id"]));
        pre_evolution = pre_evolution[0];
        if (pre_evolution) {
            if (pre_evolution["Evolution Details"].includes("Level")) {
                var evolution_detail = pre_evolution["Evolution Details"].toLowerCase();
                if (evolution_detail == "null") { evolution_detail = "" }
                evolution = pokemon_name + " evolves into " + pre_evolution["Pokemon Name"] + " starting at " + evolution_detail + "\n";
            }
            else if (pre_evolution["Evolution Details"].includes("Stone")) {
                var evolution_detail = pre_evolution["Evolution Details"].toLowerCase();
                if (evolution_detail == "null") { evolution_detail = "" }
                evolution = pokemon_name + " evolves into " + pre_evolution["Pokemon Name"] + " using " + evolution_detail + "\n";
            }
            else {
                var evolution_detail = pre_evolution["Evolution Details"].toLowerCase();
                if (evolution_detail == "null") { evolution_detail = "" }
                evolution = pokemon_name + " evolves into " + pre_evolution["Pokemon Name"] + " " + evolution_detail + "\n";
            }
        }

        // Type
        if (pokemon["Secondary Type"] != "NULL") { type = pokemon["Primary Type"] + " | " + pokemon["Secondary Type"] }
        else { type = pokemon["Primary Type"]; }

        // Image url
        var str = "" + pokemon["Pokedex Number"]
        var pad = "000"
        var pokedex_num = pad.substring(0, pad.length - str.length) + str;
        if (form == "") { var image_name = pokedex_num + '.png'; }
        else if (isshiny) { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '-Shiny.png'; isshiny = false; }
        else { var image_name = pokedex_num + '-' + form.replace(" ", "-") + '.png'; }
        var image_url = './assets/images/' + image_name;

        function create_embed() {
            // Create embed message
            let embed = new Discord.MessageEmbed();
            embed.attachFiles(image_url)
            embed.setImage('attachment://' + image_name)
            embed.setTitle("**Base stats for " + pokemon_name + "**")
            embed.setColor(message.member.displayHexColor)
            embed.setDescription(evolution + "\n"
                + "**Alternative Names:**\n🇯🇵 " + pokemon["jp_name"].join("/") + "\n🇩🇪 " + pokemon["dr_name"] + "\n🇫🇷 " + pokemon["fr_name"] + "\n\n"
                + "**Type: " + type + '**\n'
                + "**HP:** " + pokemon["Health Stat"] + '\n'
                + "**Attack:** " + pokemon["Attack Stat"] + '\n'
                + "**Defense:** " + pokemon["Defense Stat"] + '\n'
                + "**Sp. Atk:** " + pokemon["Special Attack Stat"] + '\n'
                + "**Sp. Def:** " + pokemon["Special Defense Stat"] + '\n'
                + "**Speed:** " + pokemon["Speed Stat"] + '\n')
            embed.setFooter(`Dex Number: ${pokemon["Pokedex Number"]} \nNumber caught: ${no_of_caught}`);
            message.channel.send(embed)
        }
        //#endregion
    });
}

// To display all rewards.
function rewards(bot, message, args) {

    // Getting the data from the user model
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardAmount"] > 0);
        var no_of_rewards = rewards.length;;
        if (no_of_rewards == 0) { message.channel.send("You have no rewards to claim."); return; }

        var rewards_amount = 0;
        for (var i = 0; i < no_of_rewards; i++) {
            rewards_amount += rewards[i]["RewardAmount"];
        }

        // Create embed message
        let embed = new Discord.MessageEmbed();
        embed.setTitle("**Pokedex**")
        embed.setColor(message.member.displayHexColor)
        embed.setDescription(`You have ${no_of_rewards} dex rewards to claim. You will get ${rewards_amount} credits`);
        for (i = 0; i < no_of_rewards; i++) {
            embed.addField(rewards[i].RewardName, rewards[i].RewardDescription + ' :money_with_wings:', true);
        }
        message.channel.send(embed)

    });
}

// To claim all rewards.
function claim_all(bot, message, args) {
    // Getting the data from the user model
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardAmount"] > 0);
        var no_of_rewards = rewards.length;
        if (no_of_rewards == 0) { message.channel.send("You have no rewards to claim."); return; }
        var rewards_amount = 0;

        for (var i = 0; i < no_of_rewards; i++) {
            rewards_amount += rewards[i]["RewardAmount"];
        }

        for (var i = 0; i < dex_rewards.length; i++) {
            dex_rewards[i]["RewardAmount"] = 0;
        }

        user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { DexRewards: dex_rewards }, $inc: { PokeCredits: rewards_amount } }, { new: true }, (err, user) => {
            if (err) return console.log(err);
        });
        // Message
        message.channel.send(`You claimed ${no_of_rewards} dex rewards and ${rewards_amount} credits!`);

    });

}

// To claim certain rewards.
function claim(bot, message, args) {
    // Getting the data from the user model
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) return;
        var dex_rewards = user.DexRewards;
        var rewards = dex_rewards.filter(it => it["RewardName"].toLowerCase() == args[1].toLowerCase());
        var reward_index = dex_rewards.findIndex(it => it["RewardName"].toLowerCase() == args[1].toLowerCase());
        var no_of_rewards = rewards.length;
        if (no_of_rewards == 0) { message.channel.send("No reward found in that name."); return; }

        let reward_name = rewards[0]["RewardName"];
        let rewards_amount = rewards[0]["RewardAmount"];
        dex_rewards[reward_index]["RewardAmount"] = 0;

        user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { DexRewards: dex_rewards }, $inc: { PokeCredits: rewards_amount } }, { new: true }, (err, user) => {
            if (err) return console.log(err);
        })

        // Message
        message.channel.send(`You claimed ${reward_name} dex reward and ${rewards_amount} credits!`);
    });
}

// To print all ultrabeast pokemons.
function dex_ultrabeast(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Primary Ability"] === "Beast Boost" && it["Alternate Form Name"] === "NULL");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokemon Id'], ['asc']);
    create_pagination(message, dex_pokemons, "ultra beast ");
}

// To print all legendary pokemons.
function dex_legendary(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL" && it["Primary Ability"] != "Beast Boost"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokemon Id'], ['asc']);
    create_pagination(message, dex_pokemons, "legendary ");
}

// To print all mythical pokemons.
function dex_mythical(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons, "mythical ");
}

// To print all alolan pokemons.
function dex_alolan(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons, "alolan ", "Alolan ");
}

// To print all galarian pokemons.
function dex_galarian(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons, "galarian ", "Galarian ");
}

// To print all pokemons
function dex_pokemons(bot, message, args, prefix, user_available, pokemons) {
    var new_alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola")
    for (i = 0; i < new_alolan_pokemons.length; i++) {
        new_alolan_pokemons[i]["Pokemon Name"] = get_pokemon_name(pokemons, new_alolan_pokemons[i]["Pokemon Id"]);
    }
    var new_galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar")
    for (i = 0; i < new_galarian_pokemons.length; i++) {
        new_galarian_pokemons[i]["Pokemon Name"] = get_pokemon_name(pokemons, new_galarian_pokemons[i]["Pokemon Id"]);
    }
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    dex_pokemons = dex_pokemons.concat(new_galarian_pokemons).concat(new_alolan_pokemons);
    if (isInt(args[0])) { var page = args[0] - 1 }
    create_pagination(message, dex_pokemons, "", "", page);
}

// To print all pokemons based on generation.
function dex_generation(bot, message, args, prefix, user_available, pokemons) {
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
    } else { return message.channel.send("Invalid generation value."); }
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons);
}

// To print all pokemon based on type.
function dex_type(bot, message, args, prefix, user_available, pokemons) {
    var filtered_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    var type = args[1];
    var primary_types = filtered_pokemons.filter(it => it["Primary Type"].toLowerCase() === type.toLowerCase());
    var secondary_types = filtered_pokemons.filter(it => it["Secondary Type"].toLowerCase() === type.toLowerCase());
    var dex_pokemons = primary_types.concat(secondary_types);
    if (dex_pokemons.length == 0) return message.channel.send("Invalid type value.");
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons);
}

// To print pokemon based on name.
function dex_name(bot, message, args, prefix, user_available, pokemons) {
    var filtered_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    var name = args[1];
    var dex_pokemons = filtered_pokemons.filter(it => it["Pokemon Name"].toLowerCase() === name.toLowerCase());
    if (dex_pokemons.length == 0) return message.channel.send("Invalid type value.");
    create_pagination(message, dex_pokemons);
}

// Function to display pseudo pokemons.
function dex_pseudo(bot, message, args, prefix, user_available, pokemons) {
    var pseudo_list = ["Dratini", "Dragonair", "Dragonite", "Larvitar", "Pupitar", "Tyranitar", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Gible", "Gabite", "Garchomp", "Deino", "Zweilous", "Hydreigon", "Goomy", "Sliggoo", "Goodra", "Jangmo-o", "Hakkamo-o", "Kommo-o", "Dreepy", "Drakloak", "Dragapult"];
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = dex_pokemons.filter(it => pseudo_list.includes(it["Pokemon Name"]));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons, "Pseudo ");
}

// Function to display starter pokemons.
function dex_starter(bot, message, args, prefix, user_available, pokemons) {
    var starter_list = ["Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic", "Mudkip", "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin", "Froakie", "Rowlet", "Litten", "Popplio", "Grookey", "Scorbunny", "Sobble"];
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = dex_pokemons.filter(it => starter_list.includes(it["Pokemon Name"]));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    create_pagination(message, dex_pokemons);
}

// Function to display caught pokemons.
function dex_uncaught(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    //Get user data from database
    var user_pokemons = pokemons_from_database.filter(it => it["Reason"] === "Catched");
    for (var i = 0; i < user_pokemons.length; i++) {
        dex_pokemons = dex_pokemons.filter(it => it["Pokemon Id"] != user_pokemons[i]["PokemonId"].toString());
    }
    create_pagination(message, dex_pokemons, "", "", 0, dex_pokemons.length);
}

// Function to display caught pokemons.
function dex_caught(bot, message, args, prefix, user_available, pokemons) {
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    var new_dex_pokemons = [];
    var user_pokemons = pokemons_from_database.filter(it => it["Reason"] === "Catched");
    for (var i = 0; i < user_pokemons.length; i++) {
        var pokemon = dex_pokemons.find(it => it["Pokemon Id"] === user_pokemons[i]["PokemonId"].toString());
        if (pokemon) new_dex_pokemons.push(pokemon);
    }
    new_dex_pokemons = _.uniqBy(new_dex_pokemons, 'Pokemon Id');
    var total_pokemons_uncaught = dex_pokemons.length - _.uniq(new_dex_pokemons).length;
    create_pagination(message, new_dex_pokemons, "", "", 0, total_pokemons_uncaught);
}

function dex_orderd(bot, message, args, prefix, user_available, pokemons) {
    var new_alolan_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Alola")
    for (i = 0; i < new_alolan_pokemons.length; i++) {
        new_alolan_pokemons[i]["Pokemon Name"] = get_pokemon_name(pokemons, new_alolan_pokemons[i]["Pokemon Id"]);
    }
    var new_galarian_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "Galar")
    for (i = 0; i < new_galarian_pokemons.length; i++) {
        new_galarian_pokemons[i]["Pokemon Name"] = get_pokemon_name(pokemons, new_galarian_pokemons[i]["Pokemon Id"]);
    }
    var dex_pokemons = pokemons.filter(it => it["Alternate Form Name"] === "NULL" && it["Primary Ability"] !== "Beast Boost" && it["Legendary Type"] === "NULL").concat(pokemons.filter(it => it["Legendary Type"] === "Mythical" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Legendary" && it["Alternate Form Name"] === "NULL")).concat(pokemons.filter(it => it["Legendary Type"] === "Sub-Legendary" && it["Alternate Form Name"] === "NULL"));
    dex_pokemons = _.orderBy(dex_pokemons, ['Pokedex Number'], ['asc']);
    dex_pokemons = dex_pokemons.concat(new_galarian_pokemons).concat(new_alolan_pokemons);

    create_pagination(message, dex_pokemons, "", "", 0, 0, true);
}

// Function to create pages in embeds.
function create_pagination(message, dex_pokemons, description_string = "", field_prefix = "", page = 0, total_pokemons_uncaught = 0, orderd = false) {

    var user_pokemons = pokemons_from_database.filter(it => it["Reason"] === "Catched");

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
    var old_chunked_dex_count = 1;
    var not_caught_count = 0;
    for (a = 0; a < chunked_dex.length; a++) {
        if (chunked_dex[a] == undefined) break;
        // Chunk filter
        var chunked_index = [];
        for (i = 0; i < chunked_dex[a].length; i++) {
            chunked_index.push(parseInt(chunked_dex[a][i]["Pokemon Id"]));
        }

        // Create embed message
        let embed = new Discord.MessageEmbed();
        embed.setTitle("**Pokedex**")
        embed.setColor(message.member.displayHexColor)
        embed.setFooter(`Page: ${a + 1}/${chunked_dex.length} Showing ${old_chunked_dex_count} to ${old_chunked_dex_count + chunked_dex[a].length - 1} out of ${no_of_dex}`);

        for (i = 0; i < chunked_dex[a].length; i++) {
            if (user_index.includes(chunked_index[i])) {
                var no_of_caught = user_index.filter(x => x == chunked_index[i]).length
                embed.addField(field_prefix + chunked_dex[a][i]["Pokemon Name"], `${no_of_caught} caught!  :white_check_mark:`, true);
            } else {
                not_caught_count++;
                embed.addField(field_prefix + chunked_dex[a][i]["Pokemon Name"], `Not caught yet  :x:`, true);
            }
        }

        global_embed.push(embed);
        old_chunked_dex_count += chunked_dex[a].length;
    }

    for (i = 0; i < global_embed.length; i++) {
        if (total_pokemons_uncaught > 0) { global_embed[i].setDescription(`You have not caught ${total_pokemons_uncaught} ${description_string}pokemons.\n`); }
        else if (not_caught_count == 0) { global_embed[i].setDescription("You have caught all pokemons."); }
        else { global_embed[i].setDescription(`You have not caught ${not_caught_count} ${description_string}pokemons.\n`); }
    }

    if (page > global_embed.length - 1 || page < 0) { return message.channel.send('No page found.') }

    // Send message to channel.
    message.channel.send(global_embed[page]).then(msg => {
        if (global_embed.length == 1) return;
        pagination.createpage(message.channel.id, message.author.id, msg.id, global_embed, page);
    });
}

// Get pokemon name from pokemon ID.
function get_pokemon_name(pokemons, pokemon_id) {
    var pokemon_name = "";
    var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == pokemon_id)[0];
    if (pokemon_db["Alternate Form Name"] == "Mega X" || pokemon_db["Alternate Form Name"] == "Mega Y") {
        pokemon_name = `Mega ${pokemon_db["Pokemon Name"]} ${pokemon_db["Alternate Form Name"][pokemon_db["Alternate Form Name"].length - 1]}`
    }
    else {
        var temp_name = "";
        if (pokemon_db["Alternate Form Name"] == "Alola") { temp_name = "Alolan " + pokemon_db["Pokemon Name"]; }
        else if (pokemon_db["Alternate Form Name"] == "Galar") { temp_name = "Galarian " + pokemon_db["Pokemon Name"]; }
        else if (pokemon_db["Alternate Form Name"] != "NULL") { temp_name = pokemon_db["Alternate Form Name"] + " " + pokemon_db["Pokemon Name"]; }
        else { temp_name = pokemon_db["Pokemon Name"]; }
        pokemon_name = temp_name;
    }
    return pokemon_name;
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
    aliases: []
}