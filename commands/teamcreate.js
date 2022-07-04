const user_model = require('../models/user.js');
const config = require("../config/config.json");

// Utils
const getPokemons = require('../utils/getPokemon');
const _ = require('lodash');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`Invalid syntax!`); return; }

    // Convert all to lowercase.
    args = args.map(element => {
        return element.toLowerCase();
    });

    if (!args.includes("--name")) return message.channel.send(`You can't create a team without a name!`);

    // Definitions
    var team_name = "";
    var arg_ids = [];
    var team_pokemons = [];
    var team_selected = false;

    var total_args = args.join(" ").replace(/--/g, ",--").split(",");
    total_args = _.without(total_args, "", " ");

    for (j = 0; j < total_args.length; j++) {
        new_args = total_args[j].split(" ").filter(it => it != "");

        if (new_args[0] == "--name") {
            new_args.shift();
            team_name = new_args.join(" ");
            if (team_name.length > 30) { message.channel.send(`Team name is too long!`); return; }
            if (team_name.length < 1) { message.channel.send(`Team name is too short!`); return; }
        }

        else if (new_args[0] == "--ids") {
            new_args.shift();
            // Int Check
            for (let i = 0; i < new_args.length; i++) {
                arg_ids.push(new_args[i]);
                if (!isInt(new_args[i])) {
                    return message.channel.send(`_${new_args[i]}_ is not a valid pokémon id!`);
                }
            }
        }

    }

    // Get Pokemon
    getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
        for (let i = 0; i < arg_ids.length; i++) {
            if (pokemons_from_database[arg_ids[i] - 1] != undefined) {
                team_pokemons.push(pokemons_from_database[arg_ids[i] - 1]._id.toString());
            } else return message.channel.send(`_${arg_ids[i]}_ is not a valid pokémon id!`);
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