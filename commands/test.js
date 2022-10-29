const user_model = require('../models/user');
const beta_model = require('../models/beta');

module.exports.run = async (bot, interaction, user_available, pokemons) => {

    user_model.find({}, (err, user) => {

        for (i = 0; i < user.length; i++) {
            var data = {
                "UserID": user[i].UserID,
                "Mails": [
                    {
                        "Attachment": {
                            "Pokemons": [
                                {
                                    "PokemonId": 1639,
                                    "Experience": 0,
                                    "Level": 1,
                                    "Nature": randomInteger(1, 20),
                                    "IV": [
                                        randomInteger(1, 31),
                                        randomInteger(1, 31),
                                        randomInteger(1, 31),
                                        randomInteger(1, 31),
                                        randomInteger(1, 31),
                                        randomInteger(1, 31)
                                    ],
                                    "Shiny": false,
                                    "Reason": "Beta Rewards",
                                }
                            ],
                            "Badges": [
                                "Early Bird"
                            ]
                        },
                        "From": "Pokefort",
                        "Subject": "Beta Rewards!",
                        "Message": "Thanks for being with us doing hard times, Today we have released the bot with your help, Consider this as a reward from us. Don't forget to claim your gift.",
                        "Claimed": false,
                        "Read": false,
                        "Timestamp": Date.now(),
                    }
                ]
            }

            beta_model.create(data);
        }


    });
}

// Function to return random integer
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.config = {
    name: "test",
    description: "Claim your beta rewards",
    aliases: []
}