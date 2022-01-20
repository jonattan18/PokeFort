// Models
const user_model = require('../../models/user');

// Utils
const admin = require('../../utils/admin');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (user.Admin == undefined || !admin.iseligible(user.Admin, 'playerid')) return;
        message.channel.send('ServerID: ' + message.guild.id);
    });
}

module.exports.config = {
    name: "serverid",
    aliases: []
}