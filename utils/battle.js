const _ = require('lodash');

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

function status_move(user1stats, user2stats, effects, move_info) {
    // Today upto 10 moves data entered.

    //#region codes and meanings
    // Code 0 = Doesn't change anything or do nothing.
    // Code 1 = Raise one of the allies stats. [Roses sharply]
    // Code 2 = Stops the current move. [Took the kind offer]
    // Code 3 = Gains allies stat at end of every turn. No End [Exceptional]
    // Code 4 = Heals all effects or removes status moves. [Exceptional]
    //#endregion

    //#region Status Move Process
    var move_process = move_info.process;

    /* stats receive pre condition
        .Level = level of the pokemon
        .Base = [Base_HP, Base_Attack, Base_Defense, Base_SpAttack, Base_SpDefense, Base_Speed]
        .HP = HP of the pokemon
        .Attack = Attack of the pokemon
        .Defense = Defense of the pokemon
        .Special Attack = Special Attack of the pokemon
        .Special Defense = Special Defense of the pokemon
        .Speed = Speed of the pokemon
    */

    //#region Process 0
    if (move_process.code == 0) {
        return [user1stats, user2stats, "$ failed to make a move."];
    }
    //#endregion
    //#region Process 1
    else if (move_process.code == 1) {
        if (move_process.do == "Raise") {
            if (move_process.raise == "Attack") {
                if (move_process.by == "Level") {
                    if (move_process.target == "Self") {
                        user1stats.Attack += find_stat_current_level_minus_future_level(user1stats.Base[1], move_process.Level, move_process.Level + 2);
                        return [user1stats, user2stats, `$'s attack sharply rose.`];
                    }
                }
            }
            else if (move_process.raise == "Defense") {
                if (move_process.by == "Level") {
                    if (move_process.target == "Self") {
                        user1stats.Defense += find_stat_current_level_minus_future_level(user1stats.Base[2], move_process.Level, move_process.Level + 2);
                        return [user1stats, user2stats, `$'s defense sharply rose.`];
                    }
                }
            }
            else if (move_process.raise == "Special Attack") {
                if (move_process.by == "Level") {
                    if (move_process.target == "Self") {
                        user1stats.SpecialAttack += find_stat_current_level_minus_future_level(user1stats.Base[3], move_process.Level, move_process.Level + 2);
                        return [user1stats, user2stats, `$'s special attack sharply rose.`];
                    }
                }
            }
            else if (move_process.raise == "Special Defense") {
                if (move_process.by == "Level") {
                    if (move_process.target == "Self") {
                        user1stats.SpecialDefense += find_stat_current_level_minus_future_level(user1stats.Base[4], move_process.Level, move_process.Level + 2);
                        return [user1stats, user2stats, `$'s special defense sharply rose.`];
                    }
                }
            }
            else if (move_process.raise == "Speed") {
                if (move_process.by == "Level") {
                    if (move_process.target == "Self") {
                        user1stats.Speed += find_stat_current_level_minus_future_level(user1stats.Base[5], move_process.Level, move_process.Level + 2);
                        return [user1stats, user2stats, `$'s speed sharply rose.`];
                    }
                }
            }
        }
    }
    //#endregion
    //#region Process 2
    else if (move_process.code == 2) {
        if (move_process.do == "Stop") {
            if (move_process.what == "Move") {
                if (move_process.target == "Foe") {
                    if (move_process.turns = 1) {
                        return [user1stats, user2stats, move_process.text != undefined ? move_process.text : `# unable to move.`];
                    }
                }
            }
        }
    }
    //#endregion
    //#region Process 3
    else if (move_process.code == 3) {
        if (move_process.do == "Gain") {
            if (move_process.gains == "HP") {
                if (move_process.by == "FormulaxMax") {
                    if (move_process.target == "Self") {
                        var increment = find_max_HP(user1stats.Base[0], move_process.formula);
                        user1stats.HP += increment;
                        return [user1stats, user2stats, move_info.text != undefined ? move_info.text : `$ gained ${increment} HP.`];
                    }
                }
            }
        }
    }
    //#endregion
    //#region Process 4
    else if (move_process.code == 4) {
        if (move_process.do == "Heal") {
            if (move_process.Heal == "Effects") {
                if (move_process.effects == "all") {
                    if (move_process.target == "Self") {
                        if (move_process.effects.length == 0) return [user1stats, user2stats, null, `$ had no effects to heal.`];
                        return [user1stats, user2stats, null, move_info.text != undefined ? move_info.text : `All effects healed.`];
                    }
                }
            }
        }
    }
    //#endregion
}

// Find max HP of a pokemon
function find_max_HP(hp_stat, formula) {
    return hp = (_.floor(0.01 * (2 * hp_stat + 0 + 0) * 100) + 100 + 10) * formula;
}

// Function to find pokemons stats by level.
function find_stat_current_level_minus_future_level(base, level, future_level) {
    return ((_.floor(0.01 * (2 * base + 0 + 0) * future_level) + 5) - (_.floor(0.01 * (2 * base + 0 + 0) * level) + 5));
}

// Function to calculate the type effectiveness of the move.
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

module.exports = { calculate_damage, xp_calculation, type_calc, status_move };