const user_model = require('../models/user');
const Discord = require('discord.js');

// Forms config file.
const forms_config = require("../config/forms.json");

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }

    user_model.findOne({ UserID: message.author.id }, (err, user) => {
        if (args.length == 0) {
            var embed = new Discord.MessageEmbed()
            embed.setTitle(`:moneybag: Balance: ${user.PokeCredits}`)
            embed.setColor(message.guild.me.displayHexColor)
            embed.setDescription('See a specific page of shop by using the ``' + prefix + 'shop <page number>`` command.')
            embed.addField('Page 1 |', 'XP Boosters & Rare Candies')
            embed.addField('Page 2 |', 'Rare Stones & Evolution Items')
            embed.addField('Page 3 |', 'Nature Mints')
            embed.addField('Page 4 |', 'Held Items')
            embed.addField('Page 5 |', 'Mega Evolutions')
            embed.addField('Page 6 |', 'Forms')
            embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
            message.channel.send(embed)
        }
        else if (args.length == 1 && isInt(args[0]) && args[0] == 1) page_1(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 2) page_2(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 3) page_3(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 4) page_4(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 5) page_5(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 6) page_6(message, user.PokeCredits, prefix);
        else message.channel.send(`Invalid page number!`);
    });

}

// Page 1 XP Boosters & Rare Candies
function page_1(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nXP Boosters & Rare Candies`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`Get XP boosters to increase your XP gain from chatting and battling!.\n`)
    embed.addField('30 Minutes - 2X Multiplier | Cost: 20 Credits', '``' + prefix + 'buy 1``', false)
    embed.addField('1 Hour - 2X Multiplier | Cost: 50 Credits', '``' + prefix + 'buy 2``', false)
    embed.addField('2 Hour - 2X Multiplier | Cost: 75 Credits', '``' + prefix + 'buy 3``', false)
    embed.addField('4 Hour - 1.5X Multiplier | Cost: 90 Credits', '``' + prefix + 'buy 4``', false)
    embed.addField('Rare Candy | Cost: 70 Credits', 'Rare candies level up your selected pokemon by one level for each candy you feed it.\n``' + prefix + 'buy candy <amount>``', false)
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 2 Rare Stones & Evolution Items 
function page_2(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nRare Stones & Evolution Items`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`Some pokémon don't evolve through leveling and need an evolution stone or high friendship to evolve. Here you can find all the evolution stones as well as a friendship bracelet for friendship evolutions.\n\n**All these items cost 150 credits.**`)
    embed.addField('Dawn Stone', '``' + prefix + 'buy stone Dawn``', true)
    embed.addField('Dusk Stone', '``' + prefix + 'buy stone Dusk``', true)
    embed.addField('Fire Stone', '``' + prefix + 'buy stone Fire``', true)
    embed.addField('Ice Stone', '``' + prefix + 'buy stone Ice``', true)
    embed.addField('Leaf Stone', '``' + prefix + 'buy stone Leaf``', true)
    embed.addField('Moon Stone', '``' + prefix + 'buy stone Moon``', true)
    embed.addField('Shiny Stone', '``' + prefix + 'buy stone Shiny``', true)
    embed.addField('Sun Stone', '``' + prefix + 'buy stone Sun``', true)
    embed.addField('Thunder Stone', '``' + prefix + 'buy stone Thunder``', true)
    embed.addField('Water Stone', '``' + prefix + 'buy stone Water``', true)
    embed.addField('Sweet Apple', '``' + prefix + 'buy sweet apple``', true)
    embed.addField('Tart Apple', '``' + prefix + 'buy tart apple``', true)
    embed.addField('Cracked pot', '``' + prefix + 'buy cracked pot``', true)
    embed.addField('Galariaca wreath', '``' + prefix + 'buy galariaca wreath``', true)
    embed.addField('Galarica cuff', '``' + prefix + 'buy galarica cuff``', true)
    embed.addField('Friendship Bracelet (Day/Night)', '``' + prefix + 'buy bracelet (day/night)``', true)
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 3 Nature Mints
function page_3(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nNature Mints`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription("Nature Mints change your selected pokemon's nature to a nature of your choice for credits. Use ``" + prefix + "buy nature <nature>`` to buy the nature you want!\n\n**All these nature mints cost 50 credits.**")
    embed.addField('Adamant', '+10% Attack\n-10% Sp.Atk', true)
    embed.addField('Bashful*', '+10% Sp.Atk\n-10% Sp.Atk', true)
    embed.addField('Bold', '+10% Defense\n-10% Attack', true)
    embed.addField('Brave', '+10% Attack\n-10% Speed', true)
    embed.addField('Calm', '+10% Sp.Def\n-10% Attack', true)
    embed.addField('Careful', '+10% Sp.Def\n-10% Sp.Atk', true)
    embed.addField('Docile*', '+10% Defense\n-10% Defense', true)
    embed.addField('Gentle', '+10% Sp.Def\n-10% Defense', true)
    embed.addField('Hardy*', '+10% Attack\n-10% Attack', true)
    embed.addField('Hasty', '+10% Speed\n-10% Defense', true)
    embed.addField('Impish', '+10% Defense\n-10% Sp.Atk', true)
    embed.addField('Jolly', '+10% Speed\n-10% Sp.Atk', true)
    embed.addField('Lax', '+10% Defense\n-10% Sp.Def', true)
    embed.addField('Lonely', '+10% Attack\n-10% Defense', true)
    embed.addField('Mild', '+10% Sp.Atk\n-10% Defense', true)
    embed.addField('Modest', '+10% Sp.Atk\n-10% Attack', true)
    embed.addField('Naive', '+10% Speed\n-10% Sp.Def', true)
    embed.addField('Naughty', '+10% Attack\n-10% Sp.Def', true)
    embed.addField('Quiet', '+10% Sp.Atk\n-10% Speed', true)
    embed.addField('Quirky*', '+10% Sp.Def\n-10% Sp.Def', true)
    embed.addField('Rash', '+10% Sp.Atk\n-10% Sp.Def', true)
    embed.addField('Relaxed', '+10% Defense\n-10% Speed', true)
    embed.addField('Sassy', '+10% Sp.Def\n-10% Speed', true)
    embed.addField('Serious*', '+10% Speed\n-10% Speed', true)
    embed.addField('Timid', '+10% Speed\n-10% Attack', true)
    embed.setFooter(`*These nature have no effect on stats as they increase and decrease the same stat.`)
    message.channel.send(embed)
}

// Page 4 Held Items
function page_4(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nHeld Items`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription("Buy items for your pokemon to hold using ``" + prefix + "buy item <item name>``.\n\n**All these held items cost 75 credits.**")
    embed.addField('Everstone', 'Prevents your pokemon from evolving.', false)
    embed.addField('XP Blocker', 'Prevents your pokemon from gaining XP.', false)
    embed.addField('Deep Sea Scale', 'Trade Evolution Item', true)
    embed.addField('Deep Sea Tooth', 'Trade Evolution Item', true)
    embed.addField('Dragon Scale', 'Trade Evolution Item', true)
    embed.addField('Dubious Disc', 'Trade Evolution Item', true)
    embed.addField('Electirizer', 'Trade Evolution Item', true)
    embed.addField('Kings Rock', 'Trade Evolution Item', true)
    embed.addField('Magmarizer', 'Trade Evolution Item', true)
    embed.addField('Metal Coat', 'Trade Evolution Item', true)
    embed.addField('Prism Scale', 'Trade Evolution Item', true)
    embed.addField('Protector', 'Trade Evolution Item', true)
    embed.addField('Reaper Cloth', 'Trade Evolution Item', true)
    embed.addField('Sachet', 'Trade Evolution Item', true)
    embed.addField('Up-Grade', 'Trade Evolution Item', true)
    embed.addField('Whipped Dream', 'Trade Evolution Item', true)
    embed.addField('Oval Stone', 'Trade Evolution Item', true)
    embed.addField('Razor Claw', 'Trade Evolution Item', true)
    embed.addField('Razor Fang', 'Trade Evolution Item', true)
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 5 Mega Evolutions
function page_5(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nMega Evolutions`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`To mega evolve your pokémon, you must first buy access to the mega evolution here.\n_Primal Groudon and Primal Kyogre count as regular mega evolutions._\n\n**All mega evolutions cost 1000 credits.**`)
    embed.addField('Regular Mega Evolution', '``' + prefix + 'buy mega``', true)
    embed.addField('X Mega  Evolution', '``' + prefix + 'buy mega x``', true)
    embed.addField('Y Mega  Evolution', '``' + prefix + 'buy mega y``', true)
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 6 Forms
function page_6(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nForms`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`Some pokemon have different forms, you can buy items here to allow them to transform.\n\n**All form items cost 1000 credits.**`)
    for (i = 0; i < forms_config.available_pokemons.length; i++) {
        embed.addField(forms_config.available_pokemons[i], '``' + prefix + 'buy form ' + forms_config.available_pokemons[i].toLocaleLowerCase() + '``', true)
    }
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}


// Check if value is int.
function isInt(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

module.exports.config = {
    name: "shop",
    aliases: []
}