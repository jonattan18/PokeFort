// Models
const market_model = require('../models/market');
const auction_model = require('../models/auction');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    prompt_model.findOne({ $and: [{ "UserID.User1ID": message.author.id }, { "ChannelID": message.channel.id }, { "PromptType": "ConfirmRemove" }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return message.channel.send('No prompt asked for to use ``confirmremove`` command.');

        if (prompt.List.MarketID != undefined && prompt.List.AuctionID == undefined) {
            market_model.findOne({ $and: [{ "MarketID": prompt.List.MarketID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, market) => {
                if (err) return console.log(err);
                if (!market) return message.channel.send('Sorry, the pokemon you are trying to remove is not found.');

                let pokemon_data = {
                    CatchedOn: market.CatchedOn,
                    IV: market.IV,
                    PokemonId: market.PokemonId,
                    Experience: market.Experience,
                    Level: market.Level,
                    Nature: market.NatureValue,
                    Shiny: market.Shiny,
                    Reason: market.Reason
                }

                getPokemons.insertpokemon(message.author.id, pokemon_data).then(result => {
                    prompt.remove().then(() => {
                        market.remove().then(() => {
                            message.channel.send(`Your Level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} has been removed from the market.`);
                        });
                    });
                });
            });
        }
        else if (prompt.List.MarketID == undefined && prompt.List.AuctionID != undefined) {
            auction_model.findOne({ $and: [{ "AuctionID": prompt.List.AuctionID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, auction) => {
                if (err) return console.log(err);
                if (!auction) return message.channel.send('Sorry, the pokemon you are trying to remove is not found.');

                let pokemon_data = {
                    CatchedOn: auction.CatchedOn,
                    IV: auction.IV,
                    PokemonId: auction.PokemonId,
                    Experience: auction.Experience,
                    Level: auction.Level,
                    Nature: auction.NatureValue,
                    Shiny: auction.Shiny,
                    Reason: auction.Reason
                }

                getPokemons.insertpokemon(message.author.id, pokemon_data).then(result => {
                    prompt.remove().then(() => {
                        auction.remove().then(() => {
                            message.channel.send(`Your Level ${auction.Level} ${auction.PokemonName}${auction.Shiny == true ? " :star:" : ""} has been removed from the auction.`);
                        });
                    });
                });
            });
        }
    });
}

module.exports.config = {
    name: "confirmremove",
    aliases: []
}