const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    UserID: String,
    Joined: Number,
    OrderType: String,
    PokeCredits: Number,
    Silence: Boolean,
    DuelDM: Boolean,
    Selected: String,
    Redeems: Number,
    Shards: Number,
    DailyStreak: Number,
    DailyCooldown: Number,
    RaidAlphaAgree: Boolean,
    NoCooldownRaid: Boolean,
    RewardsCatalog: {
        DexComplete: false,
        RaidDexComplete: false,
        RaidEventDexComplete: false
    },
    Raids: {
        SpawnTimestamp: Number,
        TotalDuels: Number,
        Completed: {
            Easy: Number,
            Normal: Number,
            Hard: Number,
            Challenge: Number,
            Intense: Number,
            Gigantamax: Number
        },
        Spawned: {
            Easy: Number,
            Normal: Number,
            Hard: Number,
            Challenge: Number,
            Intense: Number,
            Gigantamax: Number
        },
        Left: Number,
        Joined: Number,
        Muted: Boolean,
        TotalDamage: Number,
        RaidDex: [{
            PokemonId: Number,
            Completed: {
                Easy: Number,
                Normal: Number,
                Hard: Number,
                Challenge: Number,
                Intense: Number
            }
        }],
        EventDex: [{
            PokemonId: Number,
            Completed: {
                Easy: Number,
                Normal: Number,
                Hard: Number,
                Challenge: Number,
                Intense: Number
            }
        }]
    },
    WishingPieces: Number,
    Badges: Array,
    Admin: Number,
    TotalCaught: Number,
    TotalShiny: Number,
    MoveReplace: Array,
    TotalDueled: Number,
    DuelWon: Number,
    Boosters: { Hours: Number, Level: Number, Timestamp: Number },
    Suspend: { Hours: Number, Reason: String, Timestamp: Number },
    DexRewards: [{
        PokemonId: Number,
        RewardName: String,
        RewardAmount: Number,
        RewardDescription: String
    }],
    Teams: [{
        TeamName: String,
        Pokemons: Array,
        Selected: Boolean
    }],
    MailNotice: Boolean,
    Mails: [{
        From: String,
        Subject: String,
        Message: String,
        ImageURL: String,
        Attachment: {
            PokeCredits: Number,
            Shards: Number,
            Redeems: Number,
            WishingPieces: Number,
            Pokemons: [{
                PokemonId: Number,
                Experience: Number,
                Level: Number,
                Nature: Number,
                IV: Array,
                Shiny: Boolean,
                Reason: String
            }],
            Badges: Array
        },
        Claimed: { type: Boolean, default: false },
        Read: { type: Boolean, default: false },
        Timestamp: Number
    }],
    HideWeeklyLeaderboard: Boolean
});

const MessageModel = module.exports = mongoose.model('users', UserSchema)