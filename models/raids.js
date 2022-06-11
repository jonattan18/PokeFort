const mongoose = require('mongoose');

const RaidSchema = new mongoose.Schema({
    Primary: Boolean,
    Last_Unique_Value: Number,
    RaidID: Number,
    Leader: String,
    Started: Boolean,
    Timestamp: Number,
    Ban: [String],
    RaidPokemon: {
        ID: Number,
        Name: String,
        Level: Number,
        Health: Number,
        Attack: Number,
        Defense: Number,
        SpAttack: Number,
        SpDefense: Number,
        Speed: Number
    },
    Trainers: Array,
    TrainersData: [{
        TagName: String,
        Pokemons: Array
    }]
});

const MessageModel = module.exports = mongoose.model('raids', RaidSchema);