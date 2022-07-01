const user_model = require('../models/user.js');
const config = require("../config/config.json");

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`Invalid syntax!`); return; }

    // Definitions
    var team_name = args[0];
    var team_pokemons = [];
    var team_selected = false;

    args.shift();

    // Int Check
    for (let i = 0; i < args.length; i++) {
        if (!isInt(args[i])) {
            return message.channel.send(`_${args[i]}_ is not a valid pokémon id!`);
        }
    }

    // Get Pokemon
    getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
        for (let i = 0; i < args.length; i++) {
            if (pokemons_from_database[args[i] - 1] != undefined) {
                team_pokemons.push(pokemons_from_database[args[i] - 1]._id.toString());
            } else return message.channel.send(`_${args[i]}_ is not a valid pokémon id!`);
        }

        // Create Team.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (err) return message.channel.send(`An error occured!`);
            if (user.Teams.length >= config.MAX_TEAMS_PER_USER) return message.channel.send(`You can only have ${config.max_teams} teams!`);

            // Check if team name is already there.
            for (let i = 0; i < user.Teams.length; i++) {
                if (user.Teams[i].TeamName == team_name) {
                    return message.channel.send(`A team with the name \`${team_name}\` already exists!`);
                }
            }

            if (containsDuplicates(team_pokemons)) return message.channel.send(`You can't have same pokémon in your team!`);

            // Replace empty pokemons with null values.
            for (let i = 0; i < 6; i++) {
                if (team_pokemons[i] == undefined) {
                    team_pokemons[i] = null;
                }
            }

            user.Teams.push({
                TeamName: team_name,
                Pokemons: team_pokemons,
                Selected: team_selected
            });

            user.save().then(() => {
                message.channel.send(`Team \`${team_name}\` has been created!`);
            });
        });
    });
}

// Check if array has duplicates
function containsDuplicates(array) {
    if (array.length !== new Set(array).size) {
        return true;
    }
    return false;
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
    name: "teamcreate",
    aliases: []
}