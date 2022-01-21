const user_model = require('../../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 1) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;

        user_model.findOne({ UserID: mentioned_user.id }, (err, user) => {
            if (err) { console.log(err); return; }
            if (user.Admin == message.Adminlvl) return message.channel.send('You cannot suspend the same admin as your level.');
            if (user.Admin > message.Adminlvl) return message.channel.send('System: Command declined.');
            if (!user.Suspend.Hours) return message.channel.send('Mentioned user has no suspend.');
            user.Suspend = undefined;
            user.save().then(() => {
                message.channel.send(`${mentioned_user.username}'s suspend has been removed.`);
            }).catch(err => { return });
        });
    } else return;
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}


module.exports.config = {
    name: "remsuspend",
    aliases: []
}