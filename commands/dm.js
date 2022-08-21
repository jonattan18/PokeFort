// Models
const user_model = require('../models/user');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (user) {

            var dm = user.DuelDM == false || user.DuelDM == undefined ? true : false;
            user.DuelDM = dm;

            user.save();
            if (dm) {
                interaction.reply({ content: `Your duel instruction message has been muted!`, ephemeral: true });
            } else {
                interaction.reply({ content: `Your duel instruction message has been un-muted!`, ephemeral: true });
            }
        }
    });

}

module.exports.config = {
    name: "dm",
    description: "Mutes or unmutes your duel instruction message.",
    aliases: []
}