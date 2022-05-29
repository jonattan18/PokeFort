// Models
const prompt_model = require('../models/prompt');
const market_model = require('../models/market');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": message.author.id }, { "ChannelID": message.channel.id }, { "PromptType": "ConfirmList" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return message.channel.send('No prompt asked for to use ``confirmlist`` command.');

            // Adding to market.
            getPokemons.getallpokemon(message.author.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                if (user_pokemons.length < 2) return message.channel.send('You should have more than 1 pokemon to list in the market.');
                var selected_pokemon = user_pokemons.filter(it => it._id == prompt.List.PokemonUID)[0];

                if (selected_pokemon == undefined) return message.channel.send("Can't find that pokemon. Try again !");

                var pokemon_db = pokemons.filter(it => it["Pokemon Id"] == selected_pokemon.PokemonId)[0];

                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, false);

                let exp = selected_pokemon.Experience;
                let level = selected_pokemon.Level;
                let hp_iv = selected_pokemon.IV[0];
                let atk_iv = selected_pokemon.IV[1];
                let def_iv = selected_pokemon.IV[2];
                let spa_iv = selected_pokemon.IV[3];
                let spd_iv = selected_pokemon.IV[4];
                let spe_iv = selected_pokemon.IV[5];
                let nature = selected_pokemon.Nature;
                let shiny = selected_pokemon.Shiny;

                var type = [];
                if (pokemon_db["Secondary Type"] != "NULL") { type = [pokemon_db["Primary Type"], pokemon_db["Secondary Type"]] }
                else { type = [pokemon_db["Primary Type"]]; }
                let nature_name = nature_of(nature)[0];
                let total_iv = ((hp_iv + atk_iv + def_iv + spa_iv + spd_iv + spe_iv) / 186 * 100).toFixed(2);

                market_model.findOne({ "Primary": true }, (err, market_unqiue) => {
                    market = new market_model({
                        MarketID: market_unqiue.Last_Unique_Value + 1,
                        UserID: message.author.id,
                        PokemonId: selected_pokemon.PokemonId,
                        PokemonUID: selected_pokemon._id,
                        PokemonName: pokemon_name,
                        CatchedOn: selected_pokemon.CatchedOn,
                        Level: level,
                        Experience: exp,
                        Type: type,
                        Nature: nature_name,
                        NatureValue: nature,
                        Moves: selected_pokemon.Moves,
                        TmMoves: selected_pokemon.TmMoves,
                        IVPercentage: total_iv,
                        IV: [hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv],
                        Shiny: shiny,
                        Held: selected_pokemon.Held,
                        Price: prompt.List.Price,
                        Nickname: selected_pokemon.Nickname,
                        Reason: selected_pokemon.Reason,
                        Mega: selected_pokemon.Mega
                    });


                    market_unqiue.Last_Unique_Value++;
                    market_unqiue.save().then(() => {
                        market.save().then(() => {
                            prompt.remove().then(() => {
                                getPokemons.deletepokemon(selected_pokemon._id).then(() => {
                                    if (selected_pokemon._id == user.Selected) {
                                        var new_pokemon = user_pokemons.filter(it => it._id !== selected_pokemon._id)[0];
                                        user.Selected = new_pokemon._id;
                                        console.log(user.Selected);
                                        user.save().then(() => {
                                            message.channel.send("You have added your seleted pokemon to market list. Auto Selecting first pokemon.");
                                        });
                                    }
                                    message.channel.send(`You have listed your level ${level} ${pokemon_name} on the market for ${prompt.List.Price} credits!`);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// Function to get the nature from number.
function nature_of(int) {
    if (int == 1) { return ["Adament", 0, 10, 0, -10, 0, 0] }
    else if (int == 2) { return ["Bashful", 0, 0, 0, 0, 0, 0] }
    else if (int == 3) { return ["Bold", 0, -10, 10, 0, 0, 0] }
    else if (int == 4) { return ["Brave", 0, 10, 0, 0, 0, -10] }
    else if (int == 5) { return ["Calm", 0, -10, 0, 0, 10, 0] }
    else if (int == 6) { return ["Careful", 0, 0, 0, -10, 10, 0] }
    else if (int == 7) { return ["Docile", 0, 0, 0, 0, 0, 0] }
    else if (int == 8) { return ["Gentle", 0, 0, -10, 0, 10, 0] }
    else if (int == 9) { return ["Hardy", 0, 0, 0, 0, 0, 0] }
    else if (int == 10) { return ["Hasty", 0, 0, -10, 0, 0, 10] }
    else if (int == 11) { return ["Impish", 0, 0, 10, -10, 0, 0] }
    else if (int == 12) { return ["Jolly", 0, 0, 0, -10, 0, 10] }
    else if (int == 13) { return ["Lax", 0, 10, 0, 0, -10, 0] }
    else if (int == 14) { return ["Lonely", 0, 10, -10, 0, 0, 0] }
    else if (int == 15) { return ["Mild", 0, 0, -10, 10, 0, 0] }
    else if (int == 16) { return ["Modest", 0, 0, 0, 10, 0, -10] }
    else if (int == 17) { return ["Naive", 0, 0, 0, 0, -10, 10] }
    else if (int == 18) { return ["Naughty", 0, 10, 0, 0, -10, 0] }
    else if (int == 19) { return ["Quiet", 0, 0, 0, 10, 0, -10] }
    else if (int == 20) { return ["Quirky", 0, 0, 0, 0, 0, 0] }
    else if (int == 21) { return ["Rash", 0, 0, 0, 10, -10, 0] }
    else if (int == 22) { return ["Relaxed", 0, 0, 10, 0, 0, -10] }
    else if (int == 23) { return ["Sassy", 0, 0, 0, 0, 10, -10] }
    else if (int == 24) { return ["Serious", 0, 0, 0, 0, 0, 0] }
    else if (int == 25) { return ["Timid", 0, -10, 0, 0, 0, 10] }
}

// Percentage calculation.
function percentage(percent, total) {
    return parseInt(((percent / 100) * total).toFixed(0));
}

module.exports.config = {
    name: "confirmlist",
    aliases: []
}