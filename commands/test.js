const mongoose = require('mongoose');
const user_model = require('../models/user');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {

    var mail_send_data = {
        "Attachment": {
            "Badges": [],
            "PokeCredits": 1000000,
            "Redeems": 30,
            "Pokemons": [],
            "WishingPieces": 50
        },
        "Claimed": false,
        "Read": false,
        "ImageURL": "https://s8.gifyu.com/images/ezgif.com-gif-maker-17dd608092e819aac.gif",
        _id: new mongoose.Types.ObjectId(),
        "From": "PokéFort",
        "Subject": "Final major update for beta users.",
        "Message": "You have done a great job 🥰, participating in our **Beta** program and contributing a lot to it. We really appreciate your work, So as the bot corrected from each mistakes and sculptured to a **Marveleous** piece before your eyes🎀.\n\nIt's time to show the world, the bot we tweaked to the world. The bot will be on public within few weeks. As an art of gratitude, you will receive presents 🎁 in your mails. \n\nHence we conclude that you won't receive any further major updates as the part of beta program. But we keep on fixing flaws and release them as minor updates. We have introduced some new features in this update. So please look into your announcement channel for the list of the features. - Pokéfort Team",
        "Timestamp": Date.now()
    }

    // Update user data.
    user_model.updateMany({}, { $set: { MailNotice: true }, $push: { 'Mails': mail_send_data } }, (err, user) => {
        if (err) return console.log(err);
        console.log(`${user.length} users have been updated!`);
    });


}

module.exports.config = {
    name: "test",
    aliases: []
}