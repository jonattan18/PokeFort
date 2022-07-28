const user_model = require('../models/user.js');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length == 0) { message.channel.send(`You should ID or name to select a team!`); return; }

    // Select Team.
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (err) return message.channel.send(`An error occured!`);
        var selected_index = 0;
        // Team select using ID
        if (args.length == 1 && isInt(args[0])) {
            if (user.Teams[args[0] - 1] != undefined) {
                selected_index = args[0] - 1;
                for (let i = 0; i < user.Teams.length; i++) {
                    user.Teams[i].Selected = undefined;
                }
                user.Teams[args[0] - 1].Selected = true;
            }
            else return message.channel.send(`This \`${args[0]}\` is not a valid team ID!`);
        }
        else if (!isInt(args[0])) {
            var user_required_team = user.Teams.filter(team => team.TeamName == args.join(" ").toLowerCase());
            if (!user_required_team.length == 0) {
                var index_of_required_name = user.Teams.indexOf(user_required_team[0]);
                for (let i = 0; i < user.Teams.length; i++) {
                    user.Teams[i].Selected = undefined;
                }
                selected_index = index_of_required_name;
                user.Teams[index_of_required_name].Selected = true;
            } else return message.channel.send(`This \`${args.join(" ")}\` is not a valid team name!`);
        }
        // Final save team in user's model.
        user.save().then(() => {
            message.channel.send(`Team \`${user.Teams[selected_index].TeamName}\` has been selected!`);
        });
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