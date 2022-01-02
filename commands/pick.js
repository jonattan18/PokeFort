const Discord = require('discord.js'); // Import Discord

// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (args.length == 0) { message.channel.send("You have not mentioned any pokemon! Use ``" + prefix + "start <pokemon>``"); return; }
    const starter_pokemon = ["Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic", "Mudkip", "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin", "Froakie", "Rowlet", "Litten", "Popplio", "Grookey",  "Scorbunny", "Sobble"];
    if (starter_pokemon.some(x => x.toLowerCase() == args[0].toLowerCase()) == false) { message.channel.send("You have mentioned invalid pokemon!"); return; }
    var pokemon = pokemons.filter(it => it["Pokemon Name"].toLowerCase() === args[0].toLowerCase());
    pokemon = pokemon[0];

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) console.log(err);
        // If usser not found create new one.
        if (!user) {
            let new_user = new user_model({
                UserID: message.author.id,
                Started: true,
                Joined: Date.now(),
                PokeCredits: 0,
                Pokemons: {
                    PokemonId: pokemon["Pokemon Id"],
                    Nickname: pokemon["Pokemon Name"],
                    CatchedOn: Date.now(),
                    Experience: 0,
                    Level: 1,
                    Shiny: false,
                    Reason: "Starter"
                }
            });
            new_user.save(function (err, saved) {
                user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { Selected: saved.id } }, { new: true }, (err, updated) => {
                    if (err) { console.log(err) }
                });
            });
            message.channel.send("Congratulations! " + pokemon["Pokemon Name"] + " is your first pokemon! Type ``" + prefix + "info`` to see it!");
        } else { message.channel.send(`You have already picked a pokemon!`); return; }
    });
}

module.exports.config = {
    name: "pick",
    aliases: []
}