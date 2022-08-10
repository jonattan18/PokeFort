const Discord = require('discord.js'); // For Embedded Message.

// Models
const auction_model = require('../models/auction');
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": interaction.user.id }, { "ChannelID": interaction.channel.id }, { "PromptType": "ConfirmBid" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``confirmbid`` command.', ephemeral: true });

            auction_model.findOne({ $and: [{ "AuctionID": prompt.List.AuctionID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, auction) => {
                if (err) return console.log(err);
                if (!auction) return interaction.reply({ content: 'Sorry, the pokémon you are trying to bid on is not found.', ephemeral: true });
                var bid_time = new Date(auction.BidTime);
                var time_left = new Date(bid_time.getTime() - new Date().getTime());
                if (time_left.getTime() < 0) return interaction.reply({ content: "This auction has ended.", ephemeral: true });
                if (prompt.List.AuctionPrice > user.PokeCredits) return interaction.reply({ content: "You have insufficient balance to bid on this pokemon.", ephemeral: true });
                if (prompt.List.AuctionPrice <= auction.BidPrice) return interaction.reply({ content: `You must bid higher than the current bid. The current bid is ${auction.BidPrice}`, ephemeral: true });

                //Buy Out
                if (prompt.List.AuctionPrice == auction.BuyOut) {
                    user.PokeCredits -= auction.BuyOut;
                    var old_price = auction.BidPrice;
                    var old_usr = auction.BidUser;
                    if (auction.BidUser != undefined && auction.BidUser != interaction.user.id && (old_usr != undefined || old_usr != null)) {

                        // Send Message
                        bot.users.cache.get(old_usr).send(`You were outbid on auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}). The pokémon is bought out for ${prompt.List.AuctionPrice} credits.`);

                        user_model.findOne({ UserID: old_usr }, (err, old_bid) => {
                            old_bid.PokeCredits += old_price;
                            old_bid.save();
                        });
                    }

                    auction.Bought = true;
                    auction.BidPrice = prompt.List.AuctionPrice;
                    auction.BidTime = Date.now();
                    auction.UserClaimed = true;
                    auction.BidUser = interaction.user.id;

                    auction.save().then(() => {
                        user.save().then(() => {

                            let pokemon_data = {
                                CatchedOn: auction.CatchedOn,
                                IV: auction.IV,
                                EV: auction.EV,
                                PokemonId: auction.PokemonId,
                                Experience: auction.Experience,
                                Level: auction.Level,
                                Nature: auction.NatureValue,
                                Shiny: auction.Shiny,
                                Reason: "Auction"
                            }

                            getPokemons.insertpokemon(interaction.user.id, pokemon_data).then(result => {

                                // Send Message
                                bot.users.cache.get(auction.UserID).send(`Your level ${auction.Level} ${auction.PokemonName} has bought out for ${auction.BidPrice} credits.`);

                                interaction.reply({ content: `You have bought out the auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}) for ${prompt.List.AuctionPrice} credits.` });
                            });
                        });
                    });
                }
                else if (prompt.List.AuctionPrice > auction.BuyOut) return interaction.reply({ content: `You can't bid higher than buy out rate.`, ephemeral: true });

                //Bid
                if (prompt.List.AuctionPrice < auction.BuyOut) {
                    user.PokeCredits -= prompt.List.AuctionPrice;
                    var old_price = auction.BidPrice;
                    var old_usr = auction.BidUser;
                    if (auction.BidUser != undefined && auction.BidUser != interaction.user.id && (old_usr != undefined || old_usr != null)) {
                        user_model.findOne({ UserID: old_usr }, (err, old_bid) => {
                            old_bid.PokeCredits += old_price;
                            old_bid.save().then(() => {
                                // Send Message
                                bot.users.cache.get(old_usr).send(`You were outbid on auction ID ${auction.AuctionID} (Level ${auction.Level} ${auction.PokemonName}). The new bid is ${prompt.List.AuctionPrice} credits.`);
                            });
                        });
                    }

                    auction.BidPrice = prompt.List.AuctionPrice;
                    auction.BidUser = interaction.user.id;

                    auction.save().then(() => {
                        user.save().then(() => {
                            interaction.reply({ content: `Successfully placed a bid of ${prompt.List.AuctionPrice} credits on auction ID ${auction.AuctionID}.` });
                        });
                    });
                }
            });
        });
    });
}

module.exports.config = {
    name: "confirmbid",
    description: "Confirm bid on an auction.",
    aliases: []
}