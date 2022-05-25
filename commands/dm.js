// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 0) { message.channel.send(`Invalid Command!`); return; }
    await user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user) {

            var dm = user.DuelDM == false || user.DuelDM == undefined ? true : false;
            user.DuelDM = dm;

            user.save();
            if (dm) {
                message.channel.send(`Your duel instruction message has been muted!`);
            } else {
                message.channel.send(`Your duel instruction message has been un-muted!`);
            }
        }
    });

}

module.exports.config = {
    name: "dm",
    aliases: []
}