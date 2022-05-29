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
                                        user1.PokeCredits += market.Price;
                                        user1.save().then(() => {
                                            var embed = new Discord.MessageEmbed();
                                            embed.setTitle(`Congratulations! Your Pokemon was sold!`);
                                            embed.setDescription(`Your ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} has sold and you have received ${market.Price} Credits.`);
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

module.exports.config = {
    name: "confirmbuy",
    aliases: []
}