// Models
const user_model = require('../models/user');

module.exports.run = async (bot, interaction, user_available) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    await user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (user) {

            var silence = user.Silence == false || user.Silence == undefined ? true : false;
            user.Silence = silence;

            user.save();
            if (silence) {
                interaction.reply({ content: `Your level up message has been silenced!` });
            } else {
                interaction.reply({ content: `Your level up message has been un-silenced!` });
            }
        }
    });

}

module.exports.config = {
    name: "silence",
    description: "Silence or un-silence your level up message.",
    aliases: []
}