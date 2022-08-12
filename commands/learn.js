const Discord = require('discord.js'); // For Embedded Message.
const user_model = require('../models/user.js');

// Misc
const config = require("../config/config.json");

// Models
const prompt_model = require('../models/prompt');

// Utils
const getPokemons = require('../utils/getPokemon');
const movesparser = require('../utils/moveparser');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var args = interaction.options.get("move").value.split(" ");

    prompt_model.findOne({ $and: [{ $or: [{ "UserID.User1ID": interaction.user.id }, { "UserID.User2ID": interaction.user.id }] }, { "Duel.Accepted": true }] }, (err, _duel) => {
        if (err) return console.log(err);
        if (_duel) return interaction.reply({ content: "You can't learn pokémon moves while you are in a duel!", ephemeral: true });

        //Get user data.
        user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            var current_move = "";
            var available_moves = [];
            var available_tm_moves = [];

            getPokemons.getallpokemon(interaction.user.id).then(pokemons_from_database => {
                var user_pokemons = pokemons_from_database;
                var selected_pokemon = user_pokemons.filter(it => it._id == user.Selected)[0];

                //Get Pokemon Name from Pokemon ID.
                var pokemon_name = getPokemons.get_pokemon_name_from_id(selected_pokemon.PokemonId, pokemons, false);

                //Get pokemon name.
                var pokemon_moveset = movesparser.get_pokemon_move_from_id(selected_pokemon.PokemonId, pokemons);
                pokemon_moveset = pokemon_moveset.filter(it => it[0] <= selected_pokemon.Level);

                if (selected_pokemon.TmMoves != undefined && selected_pokemon.TmMoves.length > 0) {
                    for (var i = 0; i < selected_pokemon.TmMoves.length; i++) {
                        var move_name = movesparser.movedata(selected_pokemon.TmMoves[i], true).name;
                        available_tm_moves.push(move_name);
                    }
                }

                for (var i = 0; i < pokemon_moveset.length; i++) {
                    available_moves.push(pokemon_moveset[i][1]);
                }

                if (available_tm_moves.some(x => x.toLowerCase() == args.join(" ").toLowerCase())) {
                    current_move = available_tm_moves.filter(it => it.toLowerCase() == args.join(" ").toLowerCase())[0];
                    if (config.MOVES_CANT_BE_LEARNT.includes(movesparser.movedataname(current_move).name)) return interaction.reply({ content: `This move can't be learned as it is not usable in duel or raid.`, ephemeral: true });
                    user.MoveReplace = [selected_pokemon._id.toString(), 'TmMove', movesparser.movedataname(current_move).num];
                }
                else if (available_moves.some(x => x.toLowerCase() == args.join(" ").toLowerCase())) {
                    current_move = available_moves.filter(it => it.toLowerCase() == args.join(" ").toLowerCase())[0];
                    if (config.MOVES_CANT_BE_LEARNT.includes(movesparser.movedataname(current_move).name)) return interaction.reply({ content: `This move can't be learned as it is not usable in duel or raid.`, ephemeral: true });
                    user.MoveReplace = [selected_pokemon._id.toString(), 'Move', movesparser.movedataname(current_move).num];
                }
                else return interaction.reply({ content: `Your pokémon cannot learn that move.`, ephemeral: true });

                user.save().then(() => {
                    var embed = new Discord.EmbedBuilder();
                    embed.setTitle(`${pokemon_name}'s moves`);
                    embed.setColor(interaction.member.displayHexColor)
                    embed.setDescription(`Select the move you want to replace with ${current_move}`);
                    for (var i = 0; i < 4; i++) {
                        if (selected_pokemon.Moves != undefined && selected_pokemon.Moves[i + 1] != undefined) {
                            var move_name = selected_pokemon.Moves[i + 1];
                            embed.addFields({ name: `${move_name}`, value: `/replace ${i + 1}`, inline: true })
                        } else embed.addFields({ name: `Tackle`, value: `/replace ${i + 1}`, inline: true })
                    }
                    interaction.reply({ embeds: [embed] });
                });
            });
        });
    });
}

module.exports.config = {
    name: "learn",
    description: "Learn a move for your pokémon.",
    options: [{
        name: "move",
        description: "The move you want to learn.",
        required: true,
        type: 3
    }],
    aliases: []
}