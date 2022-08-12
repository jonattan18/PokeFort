// Load Model Data.
const user_model = require('../models/user');
const pokemons_model = require('../models/pokemons');

// Config
const config = require('../config/config.json');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    var remove_nickname = false;
    var nickname = "";

    if (interaction.options.get("name") == null && interaction.options.get("remove") != null) remove_nickname = true;
    else if (interaction.options.get("name") != null && interaction.options.get("remove") == null) nickname = interaction.options.get("name").value;
    else return interaction.reply({ content: "You must specify a name or remove a nickname.", ephemeral: true });

    if (nickname.length > config.NICKNAME_LENGTH) return interaction.reply({ content: "Nickname is too long. Max length is " + config.NICKNAME_LENGTH + " characters.", ephemeral: true });

    //Get user data.
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (!user) return;
        if (err) console.log(err);

        var _id = user.Selected; // Get selected ID.
        if (remove_nickname) nickname = undefined;
        else nickname = nickname;

        pokemons_model.findOneAndUpdate({ 'Pokemons._id': _id }, { $set: { "Pokemons.$[elem].Nickname": nickname } }, { arrayFilters: [{ 'elem._id': _id }], new: true }, (err, pokemon) => {
            if (err) return console.log(err);
            if (remove_nickname) interaction.reply({ content: `Pokemon's nickname has been removed.` });
            else interaction.reply({ content: `Set your current pokémon's nickname to ${nickname}!` });
        });
    });
}

module.exports.config = {
    name: "nickname",
    description: "Sets your current pokémon's nickname.",
    options: [{
        name: "name",
        description: "The nickname of the pokémon you want to set.",
        type: 3,
    },
    {
        name: "remove",
        description: "Removes the nickname of the pokémon you want to set.",
        type: 3,
        choices: [{
            name: "yes",
            value: "yes",
        }]
    }],
    aliases: []
}