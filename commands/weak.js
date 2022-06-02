const Discord = require('discord.js'); // For Embedded Message.

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { return message.channel.send(`You should specify a pokemon name!`); }

    // Get pokemon name.
    var pokemon_info = getPokemons.getPokemonData(args, pokemons, false);
    if (pokemon_info == null) { return message.channel.send(`Could not find the pokemon!`); }
    
    var pokemon_name = pokemon_info["Pokemon Name"];
    var primary_type = pokemon_info["Primary Type"];
    var secondary_type = pokemon_info["Secondary Type"];
    var weak = [];
    var neutral = [];
    var resist = [];
    var immune = [];

    // Get collecting weakness data.
    var types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    for (var i = 0; i < types.length; i++) {
        var type_effectiveness = type_calc(types[i].toLowerCase(), primary_type.toLowerCase(), secondary_type.toLowerCase());
        if (type_effectiveness == 0) { immune.push(types[i]); }
        else if (type_effectiveness == 1) { neutral.push(types[i]); }
        else if (type_effectiveness >= 0.25 && type_effectiveness < 1) { resist.push(types[i]); }
        else if (type_effectiveness > 1 && type_effectiveness <= 4) { weak.push(types[i]); }
    }

    var embed  = new Discord.MessageEmbed()
    embed.setTitle(`${pokemon_name} (${primary_type}${secondary_type == "NULL" ? "" : "/" + secondary_type})`)
    embed.fields = [
        { name: "Weak", value: weak.length == 0 ? "None" : weak.join(", ") },
        { name: "Neutral", value: neutral.length == 0 ? "None" : neutral.join(", ") },
        { name: "Resists", value: resist.length == 0 ? "None" : resist.join(", ") },
        { name: "Immune", value: immune.length == 0 ? "None" : immune.join(", ") }
    ];
    message.channel.send(embed);

}

function type_calc(att_type, def_type, sec_def_type) {

    if (sec_def_type != "null") {
        return type_calc(att_type, def_type, "null") * type_calc(att_type, sec_def_type, "null");
    }

    // Normal
    if (att_type == "normal" && def_type == "normal") return 1;
    if (att_type == "normal" && def_type == "fighting") return 1;
    if (att_type == "normal" && def_type == "flying") return 1;
    if (att_type == "normal" && def_type == "poison") return 1;
    if (att_type == "normal" && def_type == "ground") return 1;
    if (att_type == "normal" && def_type == "rock") return 0.5;
    if (att_type == "normal" && def_type == "bug") return 1;
    if (att_type == "normal" && def_type == "ghost") return 0;
    if (att_type == "normal" && def_type == "steel") return 0.5;
    if (att_type == "normal" && def_type == "fire") return 1;
    if (att_type == "normal" && def_type == "water") return 1;
    if (att_type == "normal" && def_type == "grass") return 1;
    if (att_type == "normal" && def_type == "electric") return 1;
    if (att_type == "normal" && def_type == "psychic") return 1;
    if (att_type == "normal" && def_type == "ice") return 1;
    if (att_type == "normal" && def_type == "dragon") return 1;
    if (att_type == "normal" && def_type == "dark") return 1;
    if (att_type == "normal" && def_type == "fairy") return 1;

    // Fighting
    if (att_type == "fighting" && def_type == "normal") return 2;
    if (att_type == "fighting" && def_type == "fighting") return 1;
    if (att_type == "fighting" && def_type == "flying") return 0.5;
    if (att_type == "fighting" && def_type == "poison") return 0.5;
    if (att_type == "fighting" && def_type == "ground") return 1;
    if (att_type == "fighting" && def_type == "rock") return 2;
    if (att_type == "fighting" && def_type == "bug") return 0.5;
    if (att_type == "fighting" && def_type == "ghost") return 0;
    if (att_type == "fighting" && def_type == "steel") return 2;
    if (att_type == "fighting" && def_type == "fire") return 1;
    if (att_type == "fighting" && def_type == "water") return 1;
    if (att_type == "fighting" && def_type == "grass") return 1;
    if (att_type == "fighting" && def_type == "electric") return 1;
    if (att_type == "fighting" && def_type == "psychic") return 0.5;
    if (att_type == "fighting" && def_type == "ice") return 2;
    if (att_type == "fighting" && def_type == "dragon") return 1;
    if (att_type == "fighting" && def_type == "dark") return 2;
    if (att_type == "fighting" && def_type == "fairy") return 0.5;

    // Flying
    if (att_type == "flying" && def_type == "normal") return 1;
    if (att_type == "flying" && def_type == "fighting") return 2;
    if (att_type == "flying" && def_type == "flying") return 1;
    if (att_type == "flying" && def_type == "poison") return 1;
    if (att_type == "flying" && def_type == "ground") return 1;
    if (att_type == "flying" && def_type == "rock") return 0.5;
    if (att_type == "flying" && def_type == "bug") return 2;
    if (att_type == "flying" && def_type == "ghost") return 1;
    if (att_type == "flying" && def_type == "steel") return 0.5;
    if (att_type == "flying" && def_type == "fire") return 1;
    if (att_type == "flying" && def_type == "water") return 1;
    if (att_type == "flying" && def_type == "grass") return 2;
    if (att_type == "flying" && def_type == "electric") return 0.5;
    if (att_type == "flying" && def_type == "psychic") return 1;
    if (att_type == "flying" && def_type == "ice") return 1;
    if (att_type == "flying" && def_type == "dragon") return 1;
    if (att_type == "flying" && def_type == "dark") return 1;
    if (att_type == "flying" && def_type == "fairy") return 1;

    // Poison
    if (att_type == "poison" && def_type == "normal") return 1;
    if (att_type == "poison" && def_type == "fighting") return 1;
    if (att_type == "poison" && def_type == "flying") return 1;
    if (att_type == "poison" && def_type == "poison") return 0.5;
    if (att_type == "poison" && def_type == "ground") return 0.5;
    if (att_type == "poison" && def_type == "rock") return 0.5;
    if (att_type == "poison" && def_type == "bug") return 1;
    if (att_type == "poison" && def_type == "ghost") return 0.5;
    if (att_type == "poison" && def_type == "steel") return 0;
    if (att_type == "poison" && def_type == "fire") return 1;
    if (att_type == "poison" && def_type == "water") return 1;
    if (att_type == "poison" && def_type == "grass") return 2;
    if (att_type == "poison" && def_type == "electric") return 1;
    if (att_type == "poison" && def_type == "psychic") return 1;
    if (att_type == "poison" && def_type == "ice") return 1;
    if (att_type == "poison" && def_type == "dragon") return 1;
    if (att_type == "poison" && def_type == "dark") return 1;
    if (att_type == "poison" && def_type == "fairy") return 2;

    // Ground
    if (att_type == "ground" && def_type == "normal") return 1;
    if (att_type == "ground" && def_type == "fighting") return 1;
    if (att_type == "ground" && def_type == "flying") return 0;
    if (att_type == "ground" && def_type == "poison") return 2;
    if (att_type == "ground" && def_type == "ground") return 1;
    if (att_type == "ground" && def_type == "rock") return 2;
    if (att_type == "ground" && def_type == "bug") return 0.5;
    if (att_type == "ground" && def_type == "ghost") return 1;
    if (att_type == "ground" && def_type == "steel") return 2;
    if (att_type == "ground" && def_type == "fire") return 2;
    if (att_type == "ground" && def_type == "water") return 1;
    if (att_type == "ground" && def_type == "grass") return 0.5;
    if (att_type == "ground" && def_type == "electric") return 2;
    if (att_type == "ground" && def_type == "psychic") return 1;
    if (att_type == "ground" && def_type == "ice") return 1;
    if (att_type == "ground" && def_type == "dragon") return 1;
    if (att_type == "ground" && def_type == "dark") return 1;
    if (att_type == "ground" && def_type == "fairy") return 1;

    // Rock
    if (att_type == "rock" && def_type == "normal") return 1;
    if (att_type == "rock" && def_type == "fighting") return 0.5;
    if (att_type == "rock" && def_type == "flying") return 2;
    if (att_type == "rock" && def_type == "poison") return 1;
    if (att_type == "rock" && def_type == "ground") return 0.5;
    if (att_type == "rock" && def_type == "rock") return 1;
    if (att_type == "rock" && def_type == "bug") return 2;
    if (att_type == "rock" && def_type == "ghost") return 1;
    if (att_type == "rock" && def_type == "steel") return 0.5;
    if (att_type == "rock" && def_type == "fire") return 2;
    if (att_type == "rock" && def_type == "water") return 1;
    if (att_type == "rock" && def_type == "grass") return 1;
    if (att_type == "rock" && def_type == "electric") return 1;
    if (att_type == "rock" && def_type == "psychic") return 1;
    if (att_type == "rock" && def_type == "ice") return 2;
    if (att_type == "rock" && def_type == "dragon") return 1;
    if (att_type == "rock" && def_type == "dark") return 1;
    if (att_type == "rock" && def_type == "fairy") return 1;

    // Bug
    if (att_type == "bug" && def_type == "normal") return 1;
    if (att_type == "bug" && def_type == "fighting") return 0.5;
    if (att_type == "bug" && def_type == "flying") return 0.5;
    if (att_type == "bug" && def_type == "poison") return 0.5;
    if (att_type == "bug" && def_type == "ground") return 1;
    if (att_type == "bug" && def_type == "rock") return 1;
    if (att_type == "bug" && def_type == "bug") return 1;
    if (att_type == "bug" && def_type == "ghost") return 0.5;
    if (att_type == "bug" && def_type == "steel") return 0.5;
    if (att_type == "bug" && def_type == "fire") return 0.5;
    if (att_type == "bug" && def_type == "water") return 1;
    if (att_type == "bug" && def_type == "grass") return 2;
    if (att_type == "bug" && def_type == "electric") return 1;
    if (att_type == "bug" && def_type == "psychic") return 2;
    if (att_type == "bug" && def_type == "ice") return 1;
    if (att_type == "bug" && def_type == "dragon") return 1;
    if (att_type == "bug" && def_type == "dark") return 2;
    if (att_type == "bug" && def_type == "fairy") return 0.5;

    // Ghost
    if (att_type == "ghost" && def_type == "normal") return 0;
    if (att_type == "ghost" && def_type == "fighting") return 1;
    if (att_type == "ghost" && def_type == "flying") return 1;
    if (att_type == "ghost" && def_type == "poison") return 1;
    if (att_type == "ghost" && def_type == "ground") return 1;
    if (att_type == "ghost" && def_type == "rock") return 1;
    if (att_type == "ghost" && def_type == "bug") return 1;
    if (att_type == "ghost" && def_type == "ghost") return 2;
    if (att_type == "ghost" && def_type == "steel") return 1;
    if (att_type == "ghost" && def_type == "fire") return 1;
    if (att_type == "ghost" && def_type == "water") return 1;
    if (att_type == "ghost" && def_type == "grass") return 1;
    if (att_type == "ghost" && def_type == "electric") return 1;
    if (att_type == "ghost" && def_type == "psychic") return 2;
    if (att_type == "ghost" && def_type == "ice") return 1;
    if (att_type == "ghost" && def_type == "dragon") return 1;
    if (att_type == "ghost" && def_type == "dark") return 0.5;
    if (att_type == "ghost" && def_type == "fairy") return 1;

    // Steel
    if (att_type == "steel" && def_type == "normal") return 1;
    if (att_type == "steel" && def_type == "fighting") return 1;
    if (att_type == "steel" && def_type == "flying") return 1;
    if (att_type == "steel" && def_type == "poison") return 1;
    if (att_type == "steel" && def_type == "ground") return 1;
    if (att_type == "steel" && def_type == "rock") return 2;
    if (att_type == "steel" && def_type == "bug") return 1;
    if (att_type == "steel" && def_type == "ghost") return 1;
    if (att_type == "steel" && def_type == "steel") return 0.5;
    if (att_type == "steel" && def_type == "fire") return 0.5;
    if (att_type == "steel" && def_type == "water") return 0.5;
    if (att_type == "steel" && def_type == "grass") return 1;
    if (att_type == "steel" && def_type == "electric") return 0.5;
    if (att_type == "steel" && def_type == "psychic") return 1;
    if (att_type == "steel" && def_type == "ice") return 2;
    if (att_type == "steel" && def_type == "dragon") return 1;
    if (att_type == "steel" && def_type == "dark") return 1;
    if (att_type == "steel" && def_type == "fairy") return 2;

    // Fire
    if (att_type == "fire" && def_type == "normal") return 1;
    if (att_type == "fire" && def_type == "fighting") return 1;
    if (att_type == "fire" && def_type == "flying") return 1;
    if (att_type == "fire" && def_type == "poison") return 1;
    if (att_type == "fire" && def_type == "ground") return 1;
    if (att_type == "fire" && def_type == "rock") return 0.5;
    if (att_type == "fire" && def_type == "bug") return 2;
    if (att_type == "fire" && def_type == "ghost") return 1;
    if (att_type == "fire" && def_type == "steel") return 2;
    if (att_type == "fire" && def_type == "fire") return 0.5;
    if (att_type == "fire" && def_type == "water") return 0.5;
    if (att_type == "fire" && def_type == "grass") return 2;
    if (att_type == "fire" && def_type == "electric") return 1;
    if (att_type == "fire" && def_type == "psychic") return 1;
    if (att_type == "fire" && def_type == "ice") return 2;
    if (att_type == "fire" && def_type == "dragon") return 0.5;
    if (att_type == "fire" && def_type == "dark") return 1;
    if (att_type == "fire" && def_type == "fairy") return 1;

    // Water
    if (att_type == "water" && def_type == "normal") return 1;
    if (att_type == "water" && def_type == "fighting") return 1;
    if (att_type == "water" && def_type == "flying") return 1;
    if (att_type == "water" && def_type == "poison") return 1;
    if (att_type == "water" && def_type == "ground") return 2;
    if (att_type == "water" && def_type == "rock") return 2;
    if (att_type == "water" && def_type == "bug") return 1;
    if (att_type == "water" && def_type == "ghost") return 1;
    if (att_type == "water" && def_type == "steel") return 1;
    if (att_type == "water" && def_type == "fire") return 2;
    if (att_type == "water" && def_type == "water") return 0.5;
    if (att_type == "water" && def_type == "grass") return 0.5;
    if (att_type == "water" && def_type == "electric") return 1;
    if (att_type == "water" && def_type == "psychic") return 1;
    if (att_type == "water" && def_type == "ice") return 1;
    if (att_type == "water" && def_type == "dragon") return 0.5;
    if (att_type == "water" && def_type == "dark") return 1;
    if (att_type == "water" && def_type == "fairy") return 1;

    // Grass
    if (att_type == "grass" && def_type == "normal") return 1;
    if (att_type == "grass" && def_type == "fighting") return 1;
    if (att_type == "grass" && def_type == "flying") return 0.5;
    if (att_type == "grass" && def_type == "poison") return 0.5;
    if (att_type == "grass" && def_type == "ground") return 2;
    if (att_type == "grass" && def_type == "rock") return 2;
    if (att_type == "grass" && def_type == "bug") return 0.5;
    if (att_type == "grass" && def_type == "ghost") return 1;
    if (att_type == "grass" && def_type == "steel") return 0.5;
    if (att_type == "grass" && def_type == "fire") return 0.5;
    if (att_type == "grass" && def_type == "water") return 2;
    if (att_type == "grass" && def_type == "grass") return 0.5;
    if (att_type == "grass" && def_type == "electric") return 1;
    if (att_type == "grass" && def_type == "psychic") return 1;
    if (att_type == "grass" && def_type == "ice") return 1;
    if (att_type == "grass" && def_type == "dragon") return 0.5;
    if (att_type == "grass" && def_type == "dark") return 1;
    if (att_type == "grass" && def_type == "fairy") return 1;

    // Electric
    if (att_type == "electric" && def_type == "normal") return 1;
    if (att_type == "electric" && def_type == "fighting") return 1;
    if (att_type == "electric" && def_type == "flying") return 2;
    if (att_type == "electric" && def_type == "poison") return 1;
    if (att_type == "electric" && def_type == "ground") return 0;
    if (att_type == "electric" && def_type == "rock") return 1;
    if (att_type == "electric" && def_type == "bug") return 1;
    if (att_type == "electric" && def_type == "ghost") return 1;
    if (att_type == "electric" && def_type == "steel") return 1;
    if (att_type == "electric" && def_type == "fire") return 1;
    if (att_type == "electric" && def_type == "water") return 2;
    if (att_type == "electric" && def_type == "grass") return 0.5;
    if (att_type == "electric" && def_type == "electric") return 0.5;
    if (att_type == "electric" && def_type == "psychic") return 1;
    if (att_type == "electric" && def_type == "ice") return 1;
    if (att_type == "electric" && def_type == "dragon") return 0.5;
    if (att_type == "electric" && def_type == "dark") return 1;
    if (att_type == "electric" && def_type == "fairy") return 1;

    // Psychic
    if (att_type == "psychic" && def_type == "normal") return 1;
    if (att_type == "psychic" && def_type == "fighting") return 2;
    if (att_type == "psychic" && def_type == "flying") return 1;
    if (att_type == "psychic" && def_type == "poison") return 2;
    if (att_type == "psychic" && def_type == "ground") return 1;
    if (att_type == "psychic" && def_type == "rock") return 1;
    if (att_type == "psychic" && def_type == "bug") return 1;
    if (att_type == "psychic" && def_type == "ghost") return 2;
    if (att_type == "psychic" && def_type == "steel") return 0.5;
    if (att_type == "psychic" && def_type == "fire") return 1;
    if (att_type == "psychic" && def_type == "water") return 1;
    if (att_type == "psychic" && def_type == "grass") return 1;
    if (att_type == "psychic" && def_type == "electric") return 1;
    if (att_type == "psychic" && def_type == "psychic") return 0.5;
    if (att_type == "psychic" && def_type == "ice") return 1;
    if (att_type == "psychic" && def_type == "dragon") return 1;
    if (att_type == "psychic" && def_type == "dark") return 0;
    if (att_type == "psychic" && def_type == "fairy") return 1;

    // Ice
    if (att_type == "ice" && def_type == "normal") return 1;
    if (att_type == "ice" && def_type == "fighting") return 1;
    if (att_type == "ice" && def_type == "flying") return 2;
    if (att_type == "ice" && def_type == "poison") return 1;
    if (att_type == "ice" && def_type == "ground") return 2;
    if (att_type == "ice" && def_type == "rock") return 1;
    if (att_type == "ice" && def_type == "bug") return 1;
    if (att_type == "ice" && def_type == "ghost") return 1;
    if (att_type == "ice" && def_type == "steel") return 0.5;
    if (att_type == "ice" && def_type == "fire") return 0.5;
    if (att_type == "ice" && def_type == "water") return 0.5;
    if (att_type == "ice" && def_type == "grass") return 2;
    if (att_type == "ice" && def_type == "electric") return 1;
    if (att_type == "ice" && def_type == "psychic") return 1;
    if (att_type == "ice" && def_type == "ice") return 0.5;
    if (att_type == "ice" && def_type == "dragon") return 2;
    if (att_type == "ice" && def_type == "dark") return 1;
    if (att_type == "ice" && def_type == "fairy") return 1;

    // Dragon
    if (att_type == "dragon" && def_type == "normal") return 1;
    if (att_type == "dragon" && def_type == "fighting") return 1;
    if (att_type == "dragon" && def_type == "flying") return 1;
    if (att_type == "dragon" && def_type == "poison") return 1;
    if (att_type == "dragon" && def_type == "ground") return 1;
    if (att_type == "dragon" && def_type == "rock") return 1;
    if (att_type == "dragon" && def_type == "bug") return 1;
    if (att_type == "dragon" && def_type == "ghost") return 1;
    if (att_type == "dragon" && def_type == "steel") return 0.5;
    if (att_type == "dragon" && def_type == "fire") return 1;
    if (att_type == "dragon" && def_type == "water") return 1;
    if (att_type == "dragon" && def_type == "grass") return 1;
    if (att_type == "dragon" && def_type == "electric") return 1;
    if (att_type == "dragon" && def_type == "psychic") return 1;
    if (att_type == "dragon" && def_type == "ice") return 1;
    if (att_type == "dragon" && def_type == "dragon") return 2;
    if (att_type == "dragon" && def_type == "dark") return 1;
    if (att_type == "dragon" && def_type == "fairy") return 0;

    // Dark
    if (att_type == "dark" && def_type == "normal") return 1;
    if (att_type == "dark" && def_type == "fighting") return 0.5;
    if (att_type == "dark" && def_type == "flying") return 1;
    if (att_type == "dark" && def_type == "poison") return 1;
    if (att_type == "dark" && def_type == "ground") return 1;
    if (att_type == "dark" && def_type == "rock") return 1;
    if (att_type == "dark" && def_type == "bug") return 1;
    if (att_type == "dark" && def_type == "ghost") return 2;
    if (att_type == "dark" && def_type == "steel") return 1;
    if (att_type == "dark" && def_type == "fire") return 1;
    if (att_type == "dark" && def_type == "water") return 1;
    if (att_type == "dark" && def_type == "grass") return 1;
    if (att_type == "dark" && def_type == "electric") return 1;
    if (att_type == "dark" && def_type == "psychic") return 2;
    if (att_type == "dark" && def_type == "ice") return 1;
    if (att_type == "dark" && def_type == "dragon") return 1;
    if (att_type == "dark" && def_type == "dark") return 0.5;
    if (att_type == "dark" && def_type == "fairy") return 0.5;

    // Fairy
    if (att_type == "fairy" && def_type == "normal") return 1;
    if (att_type == "fairy" && def_type == "fighting") return 2;
    if (att_type == "fairy" && def_type == "flying") return 1;
    if (att_type == "fairy" && def_type == "poison") return 0.5;
    if (att_type == "fairy" && def_type == "ground") return 1;
    if (att_type == "fairy" && def_type == "rock") return 1;
    if (att_type == "fairy" && def_type == "bug") return 1;
    if (att_type == "fairy" && def_type == "ghost") return 1;
    if (att_type == "fairy" && def_type == "steel") return 0.5;
    if (att_type == "fairy" && def_type == "fire") return 0.5;
    if (att_type == "fairy" && def_type == "water") return 1;
    if (att_type == "fairy" && def_type == "grass") return 1;
    if (att_type == "fairy" && def_type == "electric") return 1;
    if (att_type == "fairy" && def_type == "psychic") return 1;
    if (att_type == "fairy" && def_type == "ice") return 1;
    if (att_type == "fairy" && def_type == "dragon") return 2;
    if (att_type == "fairy" && def_type == "dark") return 2;
    if (att_type == "fairy" && def_type == "fairy") return 1;

}

module.exports.config = {
    name: "weak",
    aliases: []
}