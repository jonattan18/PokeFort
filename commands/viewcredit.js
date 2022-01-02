const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    if (args.length == 0) { return; }
    var user_id = args[0].substring(args[0].length, 3).slice(0, -1);

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.Admin != 1) return;
        message.channel.send("Admin Access Granted!");
        user_model.findOne({ UserID: user_id }, (err, user_2) => {
            if (!user_2) return message.channel.send("User not found!");
            bot.users.fetch(user_id).then(user_data => {
                message.channel.send(`${user_data.username}'s current PokeCredits ${user_2.PokeCredits}`);
            });
        });
    });

}


module.exports.config = {
    name: "viewcredit",
    aliases: []
}