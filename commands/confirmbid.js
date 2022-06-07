const Discord = require('discord.js'); // For Embedded Message.

// Models
const auction_model = require('../models/auction');
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": message.author.id }, { "ChannelID": message.channel.id }, { "PromptType": "ConfirmBid" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return message.channel.send('No prompt asked for to use ``confirmbid`` command.');

            auction_model.findOne({ $and: [{ "AuctionID": prompt.List.AuctionID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, auction) => {
                if (err) return console.log(err);
                if (!auction) return message.channel.send('Sorry, the pokemon you are trying to bid on is not found.');
                var bid_time = new Date(auction.BidTime);
                var time_left = new Date(bid_time.getTime() - new Date().getTime());
                if (time_left.getTime() < 0) return message.channel.send("This auction has ended.");
                if (prompt.List.AuctionPrice > user.PokeCredits) return message.channel.send("You have insufficient balance to bid on this pokemon.");
                if (prompt.List.AuctionPrice <= auction.BidPrice) return message.channel.send(`You must bid higher than the current bid. The current bid is ${auction.BidPrice}`);

                //Buy Out
                if (prompt.List.AuctionPrice == auction.BuyOut) {
                    user.PokeCredits -= auction.BuyOut;
                    var old_price = auction.BidPrice;
                    var old_usr = auction.BidUser;
                    if (auction.BidUser != undefined && auction.BidUser != message.author.id) {

                        // Send Message
                        bot.users.cache.get(old_usr).send(`You were outbid on auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}). The pokemon is bought out for ${prompt.List.AuctionPrice} credits.`);

                        user_model.findOne({ UserID: old_usr }, (err, old_bid) => {
                            old_bid.PokeCredits += old_price;
                            old_bid.save();
                        });
                    }

                    auction.Bought = true;
                    auction.BidPrice = prompt.List.AuctionPrice;
                    auction.BidTime = Date.now();
                    auction.UserClaimed = true;
                    auction.BidUser = message.author.id;

                    auction.save().then(() => {
                        user.save().then(() => {

                            let pokemon_data = {
                                CatchedOn: auction.CatchedOn,
                                IV: auction.IV,
                                PokemonId: auction.PokemonId,
                                Experience: auction.Experience,
                                Level: auction.Level,
                                Nature: auction.NatureValue,
                                Shiny: auction.Shiny,
                                Reason: "Market"
                            }

                            getPokemons.insertpokemon(message.author.id, pokemon_data).then(result => {

                                // Send Message
                                bot.users.cache.get(auction.UserID).send(`Your level ${auction.Level} ${auction.PokemonName} has bought out for ${auction.BidPrice} credits.`);

                                message.channel.send(`You have bought out the auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}) for ${prompt.List.AuctionPrice} credits.`);
                            });
                        });
                    });
                }
                else if (prompt.List.AuctionPrice > auction.BuyOut) return message.channel.send(`You can't bid higher than buy out rate.`);

                //Bid
                if (prompt.List.AuctionPrice < auction.BuyOut) {
                    user.PokeCredits -= prompt.List.AuctionPrice;
                    var old_price = auction.BidPrice;
                    var old_usr = auction.BidUser;
                    if (auction.BidUser != undefined && auction.BidUser != message.author.id) {
                        user_model.findOne({ UserID: old_usr }, (err, old_bid) => {
                            old_bid.PokeCredits += old_price;
                            old_bid.save().then(() => {
                                // Send Message
                                bot.users.cache.get(old_usr).send(`You were outbid on auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}). The new bid is ${prompt.List.AuctionPrice} credits.`);
                            });
                        });
                    }

                    auction.BidPrice = prompt.List.AuctionPrice;
                    auction.BidUser = message.author.id;

                    auction.save().then(() => {
                        user.save().then(() => {
                            message.channel.send(`Successfully placed a bid of ${prompt.List.AuctionPrice} credits on auction ID ${auction.AuctionID}.`);
                        });
                    });
                }
            });
        });
    });
}

module.exports.config = {
    name: "confirmbid",
    aliases: []
}