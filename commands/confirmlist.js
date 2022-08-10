// Models
const prompt_model = require('../models/prompt');
const market_model = require('../models/market');
const auction_model = require('../models/auction');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": interaction.user.id }, { "ChannelID": interaction.channel.id }, { "PromptType": "ConfirmList" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``confirmlist`` command.', ephemeral: true });

            // Adding to market or auction.
            getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                if (user_pokemons.length < 2) return interaction.reply({ content: 'You should have more than 1 pokémon to list in the market.', ephemeral: true });
                var selected_pokemon = user_pokemons.filter(it => it._id == prompt.List.PokemonUID)[0];

                if (selected_pokemon == undefined) return interaction.reply({ content: "Can't find that pokemon. Try again !", ephemeral: true });

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

                //Auction
                if (prompt.List.BidTime != undefined) {

                    // If time arguement is h
                    if (prompt.List.BidTime[prompt.List.BidTime.length - 1] == "h") {
                        // Add that much hours to  current timestamp.
                        var time = new Date().addHours(parseInt(prompt.List.BidTime.substring(0, prompt.List.BidTime.length - 1)));
                    } else if (prompt.List.BidTime[prompt.List.BidTime.length - 1] == "m") {
                        var time = new Date().addHours(parseInt(prompt.List.BidTime.substring(0, prompt.List.BidTime.length - 1)) / 60);
                    } else var time = undefined;

                    auction_model.findOne({ "Primary": true }, (err, auction_unqiue) => {
                        auction = new auction_model({
                            AuctionID: auction_unqiue.Last_Unique_Value + 1,
                            UserID: interaction.user.id,
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
                            EV: selected_pokemon.EV,
                            Shiny: shiny,
                            Held: selected_pokemon.Held,
                            BuyOut: prompt.List.Price,
                            Nickname: selected_pokemon.Nickname,
                            Reason: selected_pokemon.Reason,
                            Mega: selected_pokemon.Mega,
                            BidTime: time
                        });

                        auction_unqiue.Last_Unique_Value++;
                        auction_unqiue.save().then(() => {
                            auction.save().then(() => {
                                prompt.remove().then(() => {
                                    getPokemons.deletepokemon(selected_pokemon._id).then(() => {

                                        var listing_fee = 125;
                                        if (prompt.List.BidTime[prompt.List.BidTime.length - 1] == "h") listing_fee = 125 + (parseInt(prompt.List.BidTime) * 25);
                                        user.PokeCredits -= listing_fee;

                                        var did_selected_pokemon = false;
                                        if (selected_pokemon._id == user.Selected) {
                                            var new_pokemon = user_pokemons.filter(it => it._id !== selected_pokemon._id)[0];
                                            user.Selected = new_pokemon._id;
                                            did_selected_pokemon = true;
                                        }

                                        user.save().then(() => {
                                            if (did_selected_pokemon) interaction.reply({ content: `You have added your seleted pokémon to auction list. Auto Selecting first pokemon.`, ephemeral: true });
                                        });

                                        var time_string = prompt.List.BidTime[0, prompt.List.BidTime.length - 1] == "h" ? "hours" : "minutes";
                                        interaction.reply({ content: `You successfully auctioned your level ${level} ${pokemon_name} for ${prompt.List.BidTime.substring(0, prompt.List.BidTime.length - 1)} ${time_string} with a buyout of ${prompt.List.Price} credits.` });
                                    });
                                });
                            });
                        });
                    });
                }
                // Market
                else {

                    market_model.findOne({ "Primary": true }, (err, market_unqiue) => {
                        market = new market_model({
                            MarketID: market_unqiue.Last_Unique_Value + 1,
                            UserID: interaction.user.id,
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
                            EV: selected_pokemon.EV,
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
                                            user.save().then(() => {
                                                interaction.reply({ content: `You have added your seleted pokémon to market list. Auto Selecting first pokemon.`, ephemeral: true });
                                            });
                                        }
                                        interaction.reply({ content: `You have listed your level ${level} ${pokemon_name} on the market for ${prompt.List.Price} credits!`, ephemeral: true });
                                    });
                                });
                            });
                        });
                    });
                }

            });
        });
    });
}

// Function to get the nature from number.
function nature_of(int) {
    if (int == 0) { return ["Adamant", 0, 10, 0, -10, 0, 0] }
    else if (int == 1) { return ["Adamant", 0, 10, 0, -10, 0, 0] }
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

// Add hours to the time.
Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

// Percentage calculation.
function percentage(percent, total) {
    return parseInt(((percent / 100) * total).toFixed(0));
}

module.exports.config = {
    name: "confirmlist",
    description: "Confirm the listing of your pokemon.",
    aliases: []
}