const user_model = require('../../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!message.isadmin) return; // Admin check

    if (args.length == 3) {
        var mentioned_user = message.mentions.users.first();
        if (!mentioned_user) return;
        var reason = args[2];
        if (isInt(args[1]) || isFloat(args[1])) {

            user_model.findOne({ UserID: mentioned_user.id }, (err, user) => {
                if (err) { console.log(err); return; }
                if (user.Admin == message.Adminlvl) return message.channel.send('You cannot suspend the same admin as your level.');
                if (user.Admin > message.Adminlvl) return message.channel.send('System: Command declined.');
                if (user.Suspend.Hours) return message.channel.send('Mentioned user is already suspended.');
                user.Suspend = {};
                user.Suspend.Hours = args[1];
                user.Suspend.Reason = reason;
                user.Suspend.Timestamp = Date.now();
                user.save().then(() => {
                    message.channel.send(`${mentioned_user.username} has been suspended. Reason: ${reason}`);
                }).catch(err => { return });
            });
        }
    }
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

// Check if given value is float.
function isFloat(x) { return !!(x % 1); }


module.exports.config = {
    name: "suspend",
    aliases: []
}