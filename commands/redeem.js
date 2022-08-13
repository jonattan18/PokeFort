const Discord = require('discord.js'); // For Embedded Message.

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    await user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (user) {
            var redeems = user.Redeems == undefined ? 0 : user.Redeems;
            if (interaction.options.get("pokemon") == null && interaction.options.get("credits") == null) {
                let embed = new Discord.EmbedBuilder();
                embed.setTitle(`Your Redeems: ${redeems} :money_with_wings:`);
                embed.setDescription(`Redeems are a special type of currency that can be used to get either a pokémon of your choice, or 15,000 credits.`)
                embed.addFields({ name: `/redeem <pokémon>`, value: `Use a redeem to obtain a pokémon of your choice.`, inline: false });
                embed.addFields({ name: `/redeem credits`, value: `Use a redeem to obtain 15,000 credits.`, inline: false });
                embed.setColor(interaction.member.displayHexColor);
                interaction.reply({ embeds: [embed] });
                return;
            }
            else if (interaction.options.get("pokemon") == null && interaction.options.get("credits") != null) {
                if (redeems >= 1) {
                    user.PokeCredits += 15000;
                    user.Redeems -= 1;
                    user.save();
                    interaction.reply({ content: `You have redeemed 15,000 credits!` });
                }
                else {
                    interaction.reply({ content: `You don't have any redeems!`, ephemeral: true });
                }
            }
            else if (interaction.options.get("pokemon") != null && interaction.options.get("credits") == null) {
                if (redeems >= 1) {
                    give_pokemon(bot, interaction, user_available, pokemons, user)
                }
                else {
                    interaction.reply({ content: `You don't have any redeems!`, ephemeral: true });
                }
            } else return interaction.reply({ content: `Invalid Syntax!`, ephemeral: true });

        }
    });
}

// Function to give the user a pokemon.
function give_pokemon(bot, interaction, user_available, pokemons, user) {

    // Pokemon Level
    let level = getRandomInt(1, 36);

    var args = interaction.options.get("pokemon").value.split(" ");

    // Forms
    var form = "";
    if (args[0] == undefined) return interaction.reply({ content: "That is not a valid pokemon!", ephemeral: true });
    if (args[0].toLowerCase() == "alolan") { form = "Alola"; args.splice(0, 1) }
    else if (args[0].toLowerCase() == "galarian") { form = "Galar"; args.splice(0, 1) }
    else if (args[0].toLowerCase() == "hisuian") { form = "Hisuian"; args.splice(0, 1) }

    let given_name = args.join(" ")._normalize();

    if (form == "") {
        var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name); // Searching in English Name.
        if (pokemon.length == 0) {
            dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name); // Searching in Germany Name.
            jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name)); // Searching in Japanese Name.
            fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name); // Searching in French Name.
            if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) return interaction.reply({ content: "That is not a valid pokemon!", ephemeral: true });
        }
    }
    else {
        var pokemon = pokemons.filter(it => it["Pokemon Name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in English Name.
        if (pokemon.length == 0) {
            dr_pokemon = pokemons.filter(it => it["dr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in Germany Name.
            jp_pokemon = pokemons.filter(it => it["jp_name"].some(x => x._normalize() === given_name) && it["Alternate Form Name"] === form); // Searching in Japanese Name.
            fr_pokemon = pokemons.filter(it => it["fr_name"]._normalize() === given_name && it["Alternate Form Name"] === form); // Searching in French Name.
            if (language_finder(dr_pokemon, jp_pokemon, fr_pokemon) == false) return interaction.reply({ content: "That is not a valid pokemon!", ephemeral: true });
        }
    }

    function language_finder(dr_pokemon, jp_pokemon, fr_pokemon) {
        if (dr_pokemon.length > 0) { pokemon = dr_pokemon; }
        else if (jp_pokemon.length > 0) { pokemon = jp_pokemon; }
        else if (fr_pokemon.length > 0) { pokemon = fr_pokemon; }
        else { return false; }
    }

    pokemon = pokemon[0];
    choosen_pokemon(interaction, pokemon, level, user, pokemons);

}

// Pokemon choosen System
function choosen_pokemon(interaction, choosen_pokemon, pokemon_level, user, pokemons) {

    // Pokemon Nature
    let random_nature = getRandomInt(1, 26);
    var pokemon_shiny = false;
    if (getRandomInt(1, 2000) > 1990) {
        if (getRandomInt(0, 1000) > 990) {
            pokemon_shiny = true;
        }
    }

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

    user.Redeems -= 1;
    let pokemon_data = {
        PokemonId: choosen_pokemon["Pokemon Id"],
        Experience: 0,
        Level: pokemon_level,
        Nature: random_nature,
        IV: IV,
        Shiny: pokemon_shiny,
        Reason: "Redeem",
    }

    getPokemons.insertpokemon(interaction.user.id, pokemon_data).then(result => {
        user.save();
        var pokemon_name = getPokemons.get_pokemon_name_from_id(choosen_pokemon["Pokemon Id"], pokemons, false);
        if (pokemon_shiny == true) {
            interaction.reply({ content: `You have been given a Shiny ${pokemon_name}!` });
        }
        else {
            interaction.reply({ content: `You have been given a ${pokemon_name}!` });
        }
    });

}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// Word search normalizer.
String.prototype._normalize = function () {
    return this.valueOf().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

module.exports.config = {
    name: "redeem",
    description: "Redeem info/pokemon/credits",
    options: [{
        name: "credits",
        description: "Redeem credits",
        type: 3,
        choices: [{
            name: "yes",
            value: "yes"
        }]
    }, {
        name: "pokemon",
        description: "Redeem pokemon",
        type: 3,
        min_length: 1
    }],
    aliases: []
}