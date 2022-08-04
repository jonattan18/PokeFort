const user_model = require('../models/user.js');
const config = require("../config/config.json");

// Utils
const getPokemons = require('../utils/getPokemon');
const _ = require('lodash');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    if (interaction.options.get("name") == null) return interaction.reply({ content: `You should specify a team name!`, ephemeral: true });

    // Definitions
    var team_name = interaction.options.get("name").value.toLowerCase();
    var arg_ids = [];
    var team_pokemons = [];
    var team_selected = false;

    if (team_name.length > 30) return interaction.reply({ content: `Team name is too long!`, ephemeral: true });
    if (team_name.length < 1) return interaction.reply({ content: `Team name is too short!`, ephemeral: true });

    if (interaction.options.get("id") != null) {
        arg_ids = interaction.options.get("id").value.split(" ");

        // Int Check
        for (let i = 0; i < arg_ids.length; i++) {
            if (!isInt(arg_ids[i])) {
                return interaction.reply({ content: `One of the ID was incorrect. Please try again.`, ephemeral: true });
            }
        }
    }

    // Get Pokemon
    getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
        for (let i = 0; i < arg_ids.length; i++) {
            if (pokemons_from_database[arg_ids[i] - 1] != undefined) {
                team_pokemons.push(pokemons_from_database[arg_ids[i] - 1]._id.toString());
            } else return interaction.reply({ content: `One of the ID was incorrect. Please try again.`, ephemeral: true });
        }

        // Create Team.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (err) return console.log(err);
            if (user.Teams.length >= config.MAX_TEAMS_PER_USER) return interaction.reply({ content: `You can only have ${config.max_teams} teams!`, ephemeral: true })

            // Check if team name is already there.
            for (let i = 0; i < user.Teams.length; i++) {
                if (user.Teams[i].TeamName == team_name) {
                    return interaction.reply({ content: `A team with the name \`${team_name}\` already exists!`, ephemeral: true });
                }
            }

            if (containsDuplicates(team_pokemons)) return interaction.reply({ content: `You can't have same pokémon in your team!`, ephemeral: true });

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
                return interaction.reply({ content: `Team \`${team_name}\` has been created!` });
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
    description: "Create a team",
    options: [{
        name: "name",
        description: "Name of the team",
        required: true,
        min_length: 1,
        max_length: 30,
        type: 3,
    },
    {
        name: "id",
        description: "ID of the pokemon. Use space for multiple.",
        type: 3,
        min_length: 1,
        max_length: 30,
    }],
    aliases: []
}