const Discord = require('discord.js'); // For Embedded Message.

// Models
const market_model = require('../models/market');
const prompt_model = require('../models/prompt');
const user_model = require('../models/user');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        prompt_model.findOne({ $and: [{ "UserID.User1ID": message.author.id }, { "ChannelID": message.channel.id }, { "PromptType": "ConfirmBuy" }] }, (err, prompt) => {
            if (err) return console.log(err);
            if (!prompt) return message.channel.send('No prompt asked for to use ``confirmbuy`` command.');

            market_model.findOne({ $and: [{ "MarketID": prompt.List.MarketID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, market) => {
                if (err) return console.log(err);
                if (!market) return message.channel.send('Sorry, the pokemon you are trying to buy is not found.');

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

                user.PokeCredits -= market.Price;

                getPokemons.insertpokemon(message.author.id, pokemon_data).then(result => {
                    prompt.remove().then(() => {
                        market.remove().then(() => {
                            user.save().then(() => {
                                bot.users.fetch(market.UserID).then(user => {
                                    user_model.findOne({ UserID: user.id }, (err, user1) => {

                                        var tax_price = [];
                                        if (args[2] > 1000 && args[2] <= 10000) tax_price = ["1,000", 1.5, percentCalculation(args[2], 1.5).toFixed(0)];
                                        else if (args[2] > 10000 && args[2] <= 100000) tax_price = ["10,000", 3, percentCalculation(args[2], 3).toFixed(0)]
                                        else if (args[2] > 100000 && args[2] <= 1000000) tax_price = ["1,00,000", 4.5, percentCalculation(args[2], 4.5).toFixed(0)];
                                        else if (args[2] > 1000000) tax_price = ["1,000,000", 6, percentCalculation(args[2], 6).toFixed(0)];

                                        user1.PokeCredits += market.Price - tax_price[2];
                                        user1.save().then(() => {
                                            var embed = new Discord.MessageEmbed();
                                            embed.setTitle(`Congratulations! Your Pokemon was sold!`);
                                            embed.setDescription(`${tax_price.length > 0 ? ` _As your pokemon sold for over ${tax_price[0]} credits, ${tax_price[1]}% has been taken as tax and you have received ${args[2] - tax_price[2]} credits._\n` : ""}Your ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} has sold and you have received ${market.Price} Credits.`);
                                            user.send(embed);
                                        });
                                    });
                                });
                                message.channel.send(`Your have bought Level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} from market for ${market.Price} Credits.`);
                            });
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
    aliases: []
}