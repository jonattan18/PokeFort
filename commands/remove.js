// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Utils
const getPokemons = require('../utils/getPokemon');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 1) return message.channel.send(`Invalid syntax.`);

    if (args[0].toLowerCase() == "item") {
        //Get user data.
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            // Get all user pokemons.
            getPokemons.getallpokemon(message.author.id).then(user_pokemons => {
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];
                var _id = selected_pokemon._id;

                if (selected_pokemon.Held == undefined || selected_pokemon.Held == null) return message.channel.send(`You don't have any holding item to remove from your pokemon.`);
                else {
                    pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $unset: { "Pokemons.$[elem].Held": 1 } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
                        if (err) return console.log(err);
                        message.channel.send(`You have removed ${selected_pokemon.Held} from your pokemon.`);
                    })
                }
            });
        });
    }
}

module.exports.config = {
    name: "remove",
    aliases: []
}