const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`You should specifiy one ID to select a team!`); return; }
    if (args.length > 1) { message.channel.send(`You should only specifiy one ID to select a team!`); return; }

    // Int Check
    if (!isInt(args[0])) {
        return message.channel.send(`_${args[i]}_ is not a valid team ID!`);
    }

    // Select Team.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return message.channel.send(`An error occured!`);
        if (user.Teams[args[0] - 1] != undefined) {
            for (let i = 0; i < user.Teams.length; i++) {
                user.Teams[i].Selected = undefined;
            }
            user.Teams[args[0] - 1].Selected = true;
            user.save().then(() => {
                message.channel.send(`Team \`${user.Teams[args[0] - 1].TeamName}\` has been selected!`);
            });
        } else return message.channel.send(`_${args[i]}_ is not a valid team ID!`);
    });
}

// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "teamselect",
    aliases: []
}