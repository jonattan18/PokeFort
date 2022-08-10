// Models
const market_model = require('../models/market');
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    prompt_model.findOne({ $and: [{ "UserID.User1ID": interaction.user.id }, { "ChannelID": interaction.channel.id }, { "PromptType": "ConfirmRemove" }] }, (err, prompt) => {
        if (err) return console.log(err);
        if (!prompt) return interaction.reply({ content: 'No prompt asked for to use ``confirmremove`` command.', ephemeral: true });

        if (prompt.List.MarketID != undefined && prompt.List.AuctionID == undefined) {
            market_model.findOne({ $and: [{ "MarketID": prompt.List.MarketID }, { "PokemonUID": prompt.List.PokemonUID }] }, (err, market) => {
                if (err) return console.log(err);
                if (!market) return interaction.reply({ content: 'Sorry, the pokémon you are trying to remove is not found.', ephemeral: true });

                let pokemon_data = {
                    CatchedOn: market.CatchedOn,
                    IV: market.IV,
                    EV: market.EV,
                    PokemonId: market.PokemonId,
                    Experience: market.Experience,
                    Level: market.Level,
                    Nature: market.NatureValue,
                    Shiny: market.Shiny,
                    Reason: market.Reason
                }

                getPokemons.insertpokemon(interaction.user.id, pokemon_data).then(result => {
                    prompt.remove().then(() => {
                        market.remove().then(() => {
                            interaction.reply({ content: `Your Level ${market.Level} ${market.PokemonName}${market.Shiny == true ? " :star:" : ""} has been removed from the market.` });
                        });
                    });
                });
            });
        }
    });
}

module.exports.config = {
    name: "confirmremove",
    description: "Confirm remove a pokemon from the market.",
    aliases: []
}