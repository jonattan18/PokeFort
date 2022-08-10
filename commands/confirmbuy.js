const Discord = require('discord.js'); // For Embedded Message.

// Models
const market_model = require('../models/market');
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": interaction.user.id }, { "ChannelID": interaction.channel.id }, { "PromptType": "ConfirmBuy" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``confirmbuy`` command.', ephemeral: true });

            market_model.findOne({ $and: [{ "MarketID": prompt.List.MarketID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, market) => {
                if (err) return console.log(err);
                if (!market) return interaction.reply({ content: 'Sorry, the pokémon you are trying to buy is not found.', ephemeral: true });

                if (user.PokeCredits < market.Price) return interaction.reply({ content: "You have insufficient balance to buy this pokemon.", ephemeral: true });

                let pokemon_data = {
                    CatchedOn: market.CatchedOn,
                    IV: market.IV,
                    EV: market.EV,
                    PokemonId: market.PokemonId,
                    Experience: market.Experience,
                    Level: market.Level,
                    Nature: market.NatureValue,
                    Shiny: market.Shiny,
                    Reason: "Market"
                }

                user.PokeCredits -= market.Price;

                getPokemons.insertpokemon(interaction.user.id, pokemon_data).then(result => {
                    prompt.remove().then(() => {
                        market.remove().then(() => {
                            user.save().then(() => {
                                user_model.findOne({ UserID: market.UserID }, (err, user1) => {

                                    var tax_price = [];
                                    if (market.Price > 1000 && market.Price <= 10000) tax_price = ["1,000", 1.5, percentCalculation(market.Price, 1.5).toFixed(0)];
                                    else if (market.Price > 10000 && market.Price <= 100000) tax_price = ["10,000", 3, percentCalculation(market.Price, 3).toFixed(0)]
                                    else if (market.Price > 100000 && market.Price <= 1000000) tax_price = ["1,00,000", 4.5, percentCalculation(market.Price, 4.5).toFixed(0)];
                                    else if (market.Price > 1000000) tax_price = ["1,000,000", 6, percentCalculation(market.Prices, 6).toFixed(0)];

                                    user1.PokeCredits += (market.Price - (tax_price.length > 0 ? tax_price[2] : 0));
                                    user1.save().then(() => {
                                        var embed = new Discord.MessageEmbed();
                                        embed.setTitle(`Congratulations! Your Pokémon was sold!`);
                                        embed.setDescription(`${tax_price.length > 0 ? ` _As your pokémon sold for over ${tax_price[0]} credits, ${tax_price[1]}% has been taken as tax and you have received ${market.Price - tax_price[2]} credits._\n` : ""}Your level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} has sold and you have received ${tax_price.length > 0 ? market.Price - tax_price[2] : market.Price} Credits.`);

                                        // Send Message
                                        bot.users.cache.get(market.UserID).send(embed);

                                    });
                                });
                            });
                            interaction.reply({ content: `Your have bought Level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} from market for ${market.Price} Credits.` });
                        });
                    });
                });
            });
        });
    });
}

// Calculate percentage of given number.
function percentCalculation(a, b) {
    var c = (parseFloat(a) * parseFloat(b)) / 100;
    return parseFloat(c);
}

module.exports.config = {
    name: "confirmbuy",
    description: "Confirm the purchase of a pokémon.",
    aliases: []
}