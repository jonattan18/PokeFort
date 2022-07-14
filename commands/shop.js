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
            embed.addField('Page 7 |', 'Evs')
            embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
            message.channel.send(embed)
        }
        else if (args.length == 1 && isInt(args[0]) && args[0] == 1) page_1(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 2) page_2(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 3) page_3(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 4) page_4(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 5) page_5(message, user.PokeCredits, prefix);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 6) page_6(message, user.PokeCredits, prefix);
        else if (args.length == 1 && ((isInt(args[0]) && args[0] == 7) || args[0].toLowerCase() == "evs")) page_7(message, user.PokeCredits, prefix);
        else if (args.length == 2 && (args[0] == "forms" || args[1] == "form")) shop_forms(message, args, user.PokeCredits, prefix);
        else message.channel.send(`Invalid Shop Syntax!`);
    });

}

// Function to shop forms of a pokemon.
function shop_forms(message, args, balance, prefix) {
    if (forms_config.available_pokemons.includes(args[1].toLowerCase())) {
        var embed = new Discord.MessageEmbed()
        embed.setTitle(`:moneybag: Balance: ${balance}\n\n${args[1].capitalize()}'s Forms`);
        embed.setColor(message.guild.me.displayHexColor);
        embed.setDescription(`Some pokémon have different forms, you can buy items here to allow them to transform.\n\n**All ${args[1].capitalize()} forms cost 1,000 credits.**`)
        embed.addField(`Normal ${args[1].capitalize()} Form`, '``' + prefix + 'buy form normal ' + args[1].toLocaleLowerCase() + '``', true)
        for (i = 0; i < forms_config.available_forms[args[1].toLowerCase()].forms.length; i++) {
            if (forms_config.available_forms[args[1].toLowerCase()].forms[i] == "null") continue;
            var title = forms_config.available_forms[args[1].toLowerCase()]["Dex Search"] == "Front" ? `${forms_config.available_forms[args[1].toLowerCase()].forms[i].capitalize()} ${args[1].capitalize()}` : `${args[1].capitalize()} ${forms_config.available_forms[args[1].toLowerCase()].forms[i].capitalize()}`;
            var field = "``" + prefix + "buy form " + title.toLocaleLowerCase() + "``";
            embed.addField(title + " Form", field, true);
        }
        embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
        message.channel.send(embed);
    } else return message.channel.send("This pokémon name don't have any forms to buy!");
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
    embed.addField('Rare Candy | Cost: 70 Credits', 'Rare candies level up your selected pokémon by one level for each candy you feed it.\n``' + prefix + 'buy candy <amount>``', false)
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 2 Rare Stones & Evolution Items 
function page_2(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nRare Stones & Evolution Items`)
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`Some pokémon don't evolve through leveling and need an evolution stone or high friendship to evolve. Here you can find all the evolution stones as well as a friendship bracelet for friendship evolutions.\n\n**All these items cost 150 credits.**`)
    embed.addField('Dawn Stone', '``' + prefix + 'buy stone dawn``', true)
    embed.addField('Dusk Stone', '``' + prefix + 'buy stone dusk``', true)
    embed.addField('Fire Stone', '``' + prefix + 'buy stone fire``', true)
    embed.addField('Ice Stone', '``' + prefix + 'buy stone ice``', true)
    embed.addField('Leaf Stone', '``' + prefix + 'buy stone leaf``', true)
    embed.addField('Moon Stone', '``' + prefix + 'buy stone moon``', true)
    embed.addField('Shiny Stone', '``' + prefix + 'buy stone shiny``', true)
    embed.addField('Sun Stone', '``' + prefix + 'buy stone sun``', true)
    embed.addField('Thunder Stone', '``' + prefix + 'buy stone thunder``', true)
    embed.addField('Water Stone', '``' + prefix + 'buy stone water``', true)
    embed.addField('Oval Stone', '``' + prefix + 'buy stone oval``', true)
    embed.addField('Black Augurite Stone', '``' + prefix + 'buy stone black augurite``', true)
    embed.addField('Peat Block Stone', '``' + prefix + 'buy stone peat block``', true)
    embed.addField('Sweet apple', '``' + prefix + 'buy sweet apple``', true)
    embed.addField('Tart apple', '``' + prefix + 'buy tart apple``', true)
    embed.addField('Cracked pot', '``' + prefix + 'buy cracked pot``', true)
    embed.addField('Galarica wreath', '``' + prefix + 'buy galariaca wreath``', true)
    embed.addField('Galarica cuff', '``' + prefix + 'buy galarica cuff``', true)
    embed.addField('Razor Claw', '``' + prefix + 'buy razor claw``', true)
    embed.addField('Razor Fang', '``' + prefix + 'buy razor fang``', true)
    embed.addField('Friendship bracelet', '``' + prefix + 'buy bracelet``', true)
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
    embed.setDescription("Buy items for your pokémon to hold using ``" + prefix + "buy item <item name>``.\n\n**All these held items cost 75 credits.**")
    embed.addField('Everstone', 'Prevents your pokémon from evolving.', false)
    embed.addField('XP Blocker', 'Prevents your pokémon from gaining XP.', false)
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
    embed.addField('Upgrade', 'Trade Evolution Item', true)
    embed.addField('Whipped Dream', 'Trade Evolution Item', true)
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
    embed.setDescription(`Some pokémon have different forms, you can buy items here to allow them to transform.\n\n**All form items cost 1000 credits.**`)
    for (i = 0; i < forms_config.available_pokemons.length; i++) {
        embed.addField(forms_config.available_pokemons[i], '``' + prefix + 'shop forms ' + forms_config.available_pokemons[i].toLocaleLowerCase() + '``', true)
    }
    embed.setFooter("Need more credits ? Win duels or vote for the bot using the " + prefix + "daily command!")
    message.channel.send(embed)
}

// Page 7 Evs
function page_7(message, balance, prefix) {
    var embed = new Discord.MessageEmbed()
    embed.setTitle(`Evs`);
    embed.setColor(message.guild.me.displayHexColor)
    embed.setDescription(`Wings cost 20c each, Berries cost 50c each and Vitamins cost 150c each. Do ${prefix}buy vitamin/berry/wing <type> to buy the item!`)
    embed.addField('Health Wing', `Increases the hp EV of your selected pokemon by 1, Do \`${prefix}buy wing health\` to buy this item!`, true)
    embed.addField('Muscle Wing', `Increases the attack EV of your selected pokemon by 1, Do \`${prefix}buy wing muscle\` to buy this item!`, true)
    embed.addField('Resist Wing', `Increases the defense EV of your selected pokemon by 1, Do \`${prefix}buy wing resist\` to buy this item!`, true)
    embed.addField('Genius Wing', `Increases the special attack EV of your selected pokemon by 1, Do \`${prefix}buy wing genius\` to buy this item!`, true)
    embed.addField('Clever Wing', `Increases the special defense EV of your selected pokemon by 1, Do \`${prefix}buy wing clever\` to buy this item!`, true)
    embed.addField('Swift Wing', `Increases the speed EV of your selected pokemon by 1 Do \`${prefix}buy wing swift\` to buy this item!`, true)
    embed.addField('Hp-Up', `Increases the hp EV of your selected pokemon by 10 Do \`${prefix}buy vitamin hp-up\` to buy this item!`, true)
    embed.addField('Protein', `Increases the attack EV of your selected pokemon by 10 Do \`${prefix}buy vitamin protein\` to buy this item!`, true)
    embed.addField('Iron', `Increases the defense EV of your selected pokemon by 10 Do \`${prefix}buy vitamin iron\` to buy this item!`, true)
    embed.addField('Calcium', `Increases the special attack EV of your selected pokemon by 10 Do \`${prefix}buy vitamin calcium\` to buy this item!`, true)
    embed.addField('Zinc', `Increases the special defense EV of your selected pokemon by 10 Do \`${prefix}buy vitamin zinc\` to buy this item!`, true)
    embed.addField('Carbos', `Increases the speed EV of your selected pokemon by 10 Do \`${prefix}buy vitamin carbos\` to buy this item!`, true)
    embed.addField('Pomeg Berry', `Increases the hp EV of your selected pokemon by 10 Do \`${prefix}buy berry pomeg\` to buy this item!`, true)
    embed.addField('Kelpsy Berry', `Increases the attack EV of your selected pokemon by 10 Do \`${prefix}buy berry kelpsy\` to buy this item!`, true)
    embed.addField('Qualot Berry', `Increases the defense EV of your selected pokemon by 10 Do \`${prefix}buy berry qualot\` to buy this item!`, true)
    embed.addField('Hondew Berry', `Increases the special attack EV of your selected pokemon by 10 Do \`${prefix}buy berry hondew\` to buy this item!`, true)
    embed.addField('Grepa Berry', `Increases the special defense EV of your selected pokemon by 10 Do \`${prefix}buy berry grepa\` to buy this item!`, true)
    embed.addField('Tamato Berry', `Increases the speed EV of your selected pokemon by 10 Do \`${prefix}buy berry tamato\` to buy this item!`, true)
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