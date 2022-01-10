// Models
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 0) { message.channel.send(`Invalid Command!`); return; }
    await user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user) {

            var silence = user.Silence == false || user.Silence == undefined ? true : false;
            user.Silence = silence;

            user.save();
            if (silence) {
                message.channel.send(`Your level up message has been silenced!`);
            } else {
                message.channel.send(`Your level up message has been un-silenced!`);
            }
        }
    });

}

module.exports.config = {
    name: "silence",
    aliases: []
}