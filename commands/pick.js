const Discord = require('discord.js'); // Import Discord

// Models
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (user_available) return message.channel.send(`You have already picked a pokemon!`);
    if (args.length == 0) { message.channel.send("You have not mentioned any pokemon! Use ``" + prefix + "start <pokemon>``"); return; }
    const starter_pokemon = ["Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic", "Mudkip", "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin", "Froakie", "Rowlet", "Litten", "Popplio", "Grookey", "Scorbunny", "Sobble"];
    if (starter_pokemon.some(x => x.toLowerCase() == args[0].toLowerCase()) == false) { message.channel.send("You have mentioned invalid pokemon!"); return; }
    var pokemon = pokemons.filter(it => it["Pokemon Name"].toLowerCase() === args[0].toLowerCase());
    pokemon = pokemon[0];

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) console.log(err);

        // IV creation
        var IV = [];
        while (true) {
            let hp_iv = getRandomInt(0, 31);
            let atk_iv = getRandomInt(0, 31);
            let def_iv = getRandomInt(0, 31);
            let spa_iv = getRandomInt(0, 31);
            let spd_iv = getRandomInt(0, 31);
            let spe_iv = getRandomInt(0, 31);
            let total_iv = (hp_iv + atk_iv + def_iv + spa_iv + spd_iv + spe_iv / 186 * 100).toFixed(2);
            IV = [hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv];
            if (total_iv > 90 || total_iv < 10) { if (getRandomInt(0, 1000) > 990) { continue; } else { break; } }
            break;
        }

        // Pokemon Nature
        let random_nature = getRandomInt(1, 26);

        // Date to be uploaded.
        var pokemon_data = {
            PokemonId: pokemon["Pokemon Id"],
            Experience: 0,
            Level: 1,
            Nature: random_nature,
            IV: IV,
            Shiny: false,
            Reason: "Starter"
        }

        let new_user = new user_model({
            UserID: message.author.id,
            Started: true,
            OrderType: "Number",
            Joined: Date.now(),
            PokeCredits: 100000,
            Redeems: 0,
            Shards: 0,
        });

        new_user.save(function (err, saved) {
            getPokemons.insertpokemon(message.author.id, pokemon_data).then(result => {
                user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { Selected: result.Pokemons[0]._id } }, { new: true }, (err, updated) => {
                    if (err) return console.log(err)
                    message.channel.send("Congratulations! " + pokemon["Pokemon Name"] + " is your first pokemon! Type ``" + prefix + "info`` to see it!");
                    message.channel.send("We welcome you for taking part in beta program of this bot. We have credited you 1,00,000 PokeCredits for testing. Help yourself !");
                });
            }, err => { console.log(err) });
        });
    });
}

// Random Value
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports.config = {
    name: "pick",
    aliases: []
}