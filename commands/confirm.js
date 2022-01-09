// Models
const user_model = require('../models/user');
const channel_model = require('../models/channel');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    channel_model.findOne({ ChannelID: message.channel.id }, (err, channel) => {
        if (err) return console.log(err);
        if (!channel) return;

        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (!user) return;
            if (err) console.log(err);

            var user_prompt = channel.Prompt;
            if (user_prompt.UserID != message.author.id) { message.channel.send('No prompt asked for to use ``cancel`` command.'); return; }
            if (user_prompt.Reason == "Release") { release(message, user_prompt, user); return; }

        });
    });
}

// Function to release pokemon.
function release(message, user_prompt, user) {

    var pokemon_to_release = user_prompt.Pokemons;
    var user_pokemons = user.Pokemons;
    var released_pokemons = user.Released;

    var old_date = user_prompt.Timestamp;
    var current_date = Date.now();

    if ((current_date - old_date) / 1000 > 120) {
        message.channel.send(`Too late to release pokemon. Pokemon Spared!`);
        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);
        });
        return;
    }

    var temp_released_pokemons = user_pokemons.filter(x => pokemon_to_release.includes(x._id));
    var new_released_pokemons = released_pokemons.concat(temp_released_pokemons);
    var new_user_pokemons = user_pokemons.filter(x => !pokemon_to_release.includes(x._id));

    if (new_user_pokemons.length == 0) { message.channel.send(`You can't release all pokemons. Spare atleast one.`); return; }

    user_model.findOneAndUpdate({ UserID: message.author.id }, { $set: { "Pokemons": new_user_pokemons, "Released": new_released_pokemons } }, (err, user) => {
        if (err) console.log(err);
        if (!user) return;

        channel_model.findOneAndUpdate({ ChannelID: message.channel.id }, { $set: { "Prompt": new Object } }, (err, channel) => {
            if (err) console.log(err);

            message.channel.send(`Successfully released ${temp_released_pokemons.length} pokemons!`);
            var selected_pokemon = new_user_pokemons.filter(it => it._id == user.Selected)[0];
            if (selected_pokemon == undefined) {
                message.channel.send(`You have released your selected pokemon. Pokemon Number 1 selected!`);
                user.Selected = new_user_pokemons[0]._id;
                user.save();
            }
        });
    });
}

module.exports.config = {
    name: "confirm",
    aliases: []
}