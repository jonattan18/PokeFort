var targets = 1; // The pokemon has 1 target
var pb = 1; // No second strike Parental Blood
var weather = 1; // No weather specified
var Critical = 1; // No critical hit
var burn = 1; // No burns found
var others = 1; // No other effects

// Function to calculate damage taken by the pokemon.
function calculate_damage(user1pokemon, user_1_atk, user_1_def, user1pokemon_level, user1move, user2pokemon) {
    var part_1 = (((((2 * user1pokemon_level) / 5) + 2) * user1move.basePower * (user_1_atk / user_1_def)) / 50) + 2;
    var type_effectiveness = type_calc(user1move.type.toLowerCase(), user2pokemon["Primary Type"].toLowerCase(), user2pokemon["Secondary Type"].toLowerCase())
    var part_2 = targets * pb * weather * Critical * (rand(85, 100) / 100) * STAB(user1pokemon["Primary Type"].toLowerCase(), user1pokemon["Secondary Type"].toLowerCase(), user1move.type.toLowerCase()) * type_effectiveness * burn * others;
    var damage = (part_1 * part_2).toFixed(0);

    var damage_line = "";
    if (type_effectiveness == 0) damage_line = `It has no effect`;
    if (type_effectiveness >= 0.25 && type_effectiveness < 1) damage_line = `It's not very effective.`;
    if (type_effectiveness == 1) damage_line = ``;
    if (type_effectiveness > 1 && type_effectiveness < 4) damage_line = `It's super effective`;
    if (type_effectiveness == 4) damage_line = `It's doubly effective`;

    return [damage, damage_line];
}

function xp_calculation(user1pokemon, user1pokemon_level, user2pokemon, user2pokemon_level, traded, luckyegg) {
    var b = user2pokemon["Experience Yield"]; // Expereience yeild points.
    var fainted_Level = user2pokemon_level; // Fainted pokemon level.
    var victory_Level = user1pokemon_level; // Victory pokemon Level.
    var t = traded ? 1.5 : 1; // If the pokemon was traded, then t = 1. Otherwise, t = 1.
    var v = 1 // winning Pokémon is at or past the level where it would be able to evolve.
    var f = 1; // No friend's pokemon.
    var s = 1; // Pokemon fought in battle.
    var p = 1; // No Point power.
    var e = luckyegg ? 1.5 : 1;
    var xp = (((b * fainted_Level * f * v) / 5 * s) * (((2 * fainted_Level + 10) / (fainted_Level + victory_Level + 10)) ** 2.5) * t * e * p);
    if (user1pokemon_level >= user2pokemon_level) xp = (xp * 2) + 100;
    else xp = xp ** 2;
    return xp.toFixed(0);
}

function STAB(pokemon_type, pokemon_secondary_type, move_type) {
    if (pokemon_type.toLowerCase() == move_type.toLowerCase() || (pokemon_secondary_type.toLowerCase() == move_type.toLowerCase() && pokemon_secondary_type != "NULL")) {
        return 1.5;
    } else {
        return 1;
    }
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

function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { calculate_damage, xp_calculation };