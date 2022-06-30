const user_model = require('../models/user.js');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (!args.length == 2) { message.channel.send(`You should specifiy slot number and pokémon ID to edit a team!`); return; }

    // Int Check
    if (!isInt(args[0]) || args[0] > 6 || args[0] < 1) {
        return message.channel.send(`_${args[i]}_ is not a valid slot number!`);
    }
    if (!isInt(args[1])) {
        return message.channel.send(`_${args[i]}_ is not a valid pokémon ID!`);
    }

    // Edit Team.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return message.channel.send(`An error occured!`);
        else {
            var selected_team = user.Teams.filter(team => team.Selected == true)[0];
            if (selected_team == undefined) {
                return message.channel.send(`You should select a team first!`);
            }
            else {
                // Get Pokemon
                getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                    var pokemondb = pokemons_from_database[args[1] - 1];
                    if (pokemondb == undefined) {
                        return message.channel.send(`_${args[1]}_ is not a valid pokémon ID!`);
                    }
                    else {
                        if(selected_team.Pokemons.includes(pokemondb._id.toString())) return message.channel.send(`That pokémon already exists in your team!`);
                        var index_of_selected = user.Teams.indexOf(selected_team);
                        user.Teams[index_of_selected].Pokemons[args[0] - 1] = pokemondb._id.toString();
                        user.markModified('Teams');
                        user.save().then(() => {
                            message.channel.send(`Pokemon#${args[0]} has been replaced with a level ${pokemondb.Level} ${getPokemons.get_pokemon_name_from_id(pokemondb["PokemonId"], pokemons, pokemondb.Shiny, true)}!`);
                        });
                    }
                });
            }
        }
    });
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
    name: "teamedit",
    aliases: []
}