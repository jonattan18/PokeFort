const user_model = require('../models/user');
const Discord = require('discord.js');

// Forms config file.
const forms_config = require("../config/forms.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });
    var args = interaction.options.get("page") ? interaction.options.get("page").value.split(" ") : [];
    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
        if (args.length == 0 && interaction.options.get("forms") == null) {
            var embed = new Discord.EmbedBuilder()
            embed.setTitle(`:moneybag: Balance: ${user.PokeCredits}`)
            embed.setColor(interaction.member.displayHexColor)
            embed.setDescription('See a specific page of shop by using the ``/shop <page number>`` command.')
            embed.addFields({ name: 'Page 1 |', value: 'XP Boosters & Rare Candies' })
            embed.addFields({ name: 'Page 2 |', value: 'Rare Stones & Evolution Items' })
            embed.addFields({ name: 'Page 3 |', value: 'Nature Mints' })
            embed.addFields({ name: 'Page 4 |', value: 'Held Items' })
            embed.addFields({ name: 'Page 5 |', value: 'Mega Evolutions' })
            embed.addFields({ name: 'Page 6 |', value: 'Forms' })
            embed.addFields({ name: 'Page 7 |', value: 'Evs' })
            embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
            interaction.reply({ embeds: [embed] })
        }
        else if (args.length == 1 && isInt(args[0]) && args[0] == 1) page_1(interaction, user.PokeCredits);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 2) page_2(interaction, user.PokeCredits);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 3) page_3(interaction, user.PokeCredits);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 4) page_4(interaction, user.PokeCredits);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 5) page_5(interaction, user.PokeCredits);
        else if (args.length == 1 && isInt(args[0]) && args[0] == 6) page_6(interaction, user.PokeCredits);
        else if (args.length == 1 && ((isInt(args[0]) && args[0] == 7) || args[0].toLowerCase() == "evs")) page_7(interaction, user.PokeCredits);
        else if (interaction.options.get("forms") != null) shop_forms(interaction, args, user.PokeCredits);
        else interaction.reply({ content: `Invalid Shop Syntax!`, ephemeral: true });
    });

}

// Function to shop forms of a pokemon.
function shop_forms(interaction, args, balance) {
    args = interaction.options.get("forms").value.split(" ");
    if (interaction.options.get("page") != null) return interaction.reply({ content: `Forms have no page for now!`, ephemeral: true });
    if (forms_config.available_pokemons.includes(args[0].toLowerCase())) {
        var embed = new Discord.EmbedBuilder()
        embed.setTitle(`:moneybag: Balance: ${balance}\n\n${args[0].capitalize()}'s Forms`);
        embed.setColor(interaction.member.displayHexColor);
        embed.setDescription(`Some pokémon have different forms, you can buy items here to allow them to transform.\n\n**All ${args[0].capitalize()} forms cost 1,000 credits.**`)
        embed.addFields({ name: `Normal ${args[0].capitalize()} Form`, value: '``/buy form normal ' + args[0].toLocaleLowerCase() + '``', inline: true })
        for (i = 0; i < forms_config.available_forms[args[0].toLowerCase()].forms.length; i++) {
            if (forms_config.available_forms[args[0].toLowerCase()].forms[i] == "null") continue;
            var title = forms_config.available_forms[args[0].toLowerCase()]["Dex Search"] == "Front" ? `${forms_config.available_forms[args[0].toLowerCase()].forms[i].capitalize()} ${args[0].capitalize()}` : `${args[0].capitalize()} ${forms_config.available_forms[args[0].toLowerCase()].forms[i].capitalize()}`;
            var field = "``/buy form " + title.toLocaleLowerCase() + "``";
            embed.addFields({ name: title + " Form", value: field, inline: true });
        }
        embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
        interaction.reply({ embeds: [embed] });
    } else return interaction.reply({ content: "This pokémon name don't have any forms to buy!", ephemeral: true });
}

// Page 1 XP Boosters & Rare Candies
function page_1(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nXP Boosters & Rare Candies`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription(`Get XP boosters to increase your XP gain from chatting and battling!.\n`)
    embed.addFields({ name: '30 Minutes - 2X Multiplier | Cost: 20 Credits', value: '``/buy 1``', inline: false })
    embed.addFields({ name: '1 Hour - 2X Multiplier | Cost: 50 Credits', value: '``/buy 2``', inline: false })
    embed.addFields({ name: '2 Hour - 2X Multiplier | Cost: 75 Credits', value: '``/buy 3``', inline: false })
    embed.addFields({ name: '4 Hour - 1.5X Multiplier | Cost: 90 Credits', value: '``/buy 4``', inline: false })
    embed.addFields({ name: 'Rare Candy | Cost: 70 Credits', value: 'Rare candies level up your selected pokémon by one level for each candy you feed it.\n``/buy candy <amount>``', inline: false })
    embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
    interaction.reply({ embeds: [embed] })
}

// Page 2 Rare Stones & Evolution Items 
function page_2(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nRare Stones & Evolution Items`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription(`Some pokémon don't evolve through leveling and need an evolution stone or high friendship to evolve. Here you can find all the evolution stones as well as a friendship bracelet for friendship evolutions.\n\n**All these items cost 150 credits.**`)
    embed.addFields({ name: 'Dawn Stone', value: '``/buy stone dawn``', inline: true })
    embed.addFields({ name: 'Dusk Stone', value: '``/buy stone dusk``', inline: true })
    embed.addFields({ name: 'Fire Stone', value: '``/buy stone fire``', inline: true })
    embed.addFields({ name: 'Ice Stone', value: '``/buy stone ice``', inline: true })
    embed.addFields({ name: 'Leaf Stone', value: '``/buy stone leaf``', inline: true })
    embed.addFields({ name: 'Moon Stone', value: '``/buy stone moon``', inline: true })
    embed.addFields({ name: 'Shiny Stone', value: '``/buy stone shiny``', inline: true })
    embed.addFields({ name: 'Sun Stone', value: '``/buy stone sun``', inline: true })
    embed.addFields({ name: 'Thunder Stone', value: '``/buy stone thunder``', inline: true })
    embed.addFields({ name: 'Water Stone', value: '``/buy stone water``', inline: true })
    embed.addFields({ name: 'Oval Stone', value: '``/buy stone oval``', inline: true })
    embed.addFields({ name: 'Black Augurite Stone', value: '``/buy stone black augurite``', inline: true })
    embed.addFields({ name: 'Peat Block Stone', value: '``/buy stone peat block``', inline: true })
    embed.addFields({ name: 'Sweet apple', value: '``/buy sweet apple``', inline: true })
    embed.addFields({ name: 'Tart apple', value: '``/buy tart apple``', inline: true })
    embed.addFields({ name: 'Cracked pot', value: '``/buy cracked pot``', inline: true })
    embed.addFields({ name: 'Galarica wreath', value: '``/buy galariaca wreath``', inline: true })
    embed.addFields({ name: 'Galarica cuff', value: '``/buy galarica cuff``', inline: true })
    embed.addFields({ name: 'Razor Claw', value: '``/buy razor claw``', inline: true })
    embed.addFields({ name: 'Razor Fang', value: '``/buy razor fang``', inline: true })
    embed.addFields({ name: 'Friendship bracelet', value: '``/buy bracelet``', inline: true })
    embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
    interaction.reply({ embeds: [embed] })
}

// Page 3 Nature Mints
function page_3(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nNature Mints`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription("Nature Mints change your selected pokemon's nature to a nature of your choice for credits. Use ``/buy nature <nature>`` to buy the nature you want!\n\n**All these nature mints cost 50 credits.**")
    embed.addFields({ name: 'Adamant', value: '+10% Attack\n-10% Sp.Atk', inline: true })
    embed.addFields({ name: 'Bashful*', value: '+10% Sp.Atk\n-10% Sp.Atk', inline: true })
    embed.addFields({ name: 'Bold', value: '+10% Defense\n-10% Attack', inline: true })
    embed.addFields({ name: 'Brave', value: '+10% Attack\n-10% Speed', inline: true })
    embed.addFields({ name: 'Calm', value: '+10% Sp.Def\n-10% Attack', inline: true })
    embed.addFields({ name: 'Careful', value: '+10% Sp.Def\n-10% Sp.Atk', inline: true })
    embed.addFields({ name: 'Docile*', value: '+10% Defense\n-10% Defense', inline: true })
    embed.addFields({ name: 'Gentle', value: '+10% Sp.Def\n-10% Defense', inline: true })
    embed.addFields({ name: 'Hardy*', value: '+10% Attack\n-10% Attack', inline: true })
    embed.addFields({ name: 'Hasty', value: '+10% Speed\n-10% Defense', inline: true })
    embed.addFields({ name: 'Impish', value: '+10% Defense\n-10% Sp.Atk', inline: true })
    embed.addFields({ name: 'Jolly', value: '+10% Speed\n-10% Sp.Atk', inline: true })
    embed.addFields({ name: 'Lax', value: '+10% Defense\n-10% Sp.Def', inline: true })
    embed.addFields({ name: 'Lonely', value: '+10% Attack\n-10% Defense', inline: true })
    embed.addFields({ name: 'Mild', value: '+10% Sp.Atk\n-10% Defense', inline: true })
    embed.addFields({ name: 'Modest', value: '+10% Sp.Atk\n-10% Attack', inline: true })
    embed.addFields({ name: 'Naive', value: '+10% Speed\n-10% Sp.Def', inline: true })
    embed.addFields({ name: 'Naughty', value: '+10% Attack\n-10% Sp.Def', inline: true })
    embed.addFields({ name: 'Quiet', value: '+10% Sp.Atk\n-10% Speed', inline: true })
    embed.addFields({ name: 'Quirky*', value: '+10% Sp.Def\n-10% Sp.Def', inline: true })
    embed.addFields({ name: 'Rash', value: '+10% Sp.Atk\n-10% Sp.Def', inline: true })
    embed.addFields({ name: 'Relaxed', value: '+10% Defense\n-10% Speed', inline: true })
    embed.addFields({ name: 'Sassy', value: '+10% Sp.Def\n-10% Speed', inline: true })
    embed.addFields({ name: 'Serious*', value: '+10% Speed\n-10% Speed', inline: true })
    embed.addFields({ name: 'Timid', value: '+10% Speed\n-10% Attack', inline: true })
    embed.setFooter({ text: `*These nature have no effect on stats as they increase and decrease the same stat.` })
    interaction.reply({ embeds: [embed] })
}

// Page 4 Held Items
function page_4(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nHeld Items`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription("Buy items for your pokémon to hold using ``/buy item <item name>``.\n\n**All these held items cost 75 credits.**")
    embed.addFields({ name: 'Everstone', value: 'Prevents your pokémon from evolving.', inline: false })
    embed.addFields({ name: 'XP Blocker', value: 'Prevents your pokémon from gaining XP.', inline: false })
    embed.addFields({ name: 'Deep Sea Scale', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Deep Sea Tooth', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Dragon Scale', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Dubious Disc', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Electirizer', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Kings Rock', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Magmarizer', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Metal Coat', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Prism Scale', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Protector', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Reaper Cloth', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Sachet', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Upgrade', value: 'Trade Evolution Item', inline: true })
    embed.addFields({ name: 'Whipped Dream', value: 'Trade Evolution Item', inline: true })
    embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
    interaction.reply({ embeds: [embed] })
}

// Page 5 Mega Evolutions
function page_5(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nMega Evolutions`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription(`To mega evolve your pokémon, you must first buy access to the mega evolution here.\n_Primal Groudon and Primal Kyogre count as regular mega evolutions._\n\n**All mega evolutions cost 1000 credits.**`)
    embed.addFields({ name: 'Regular Mega Evolution', value: '``/buy mega``', inline: true })
    embed.addFields({ name: 'X Mega  Evolution', value: '``/buy mega x``', inline: true })
    embed.addFields({ name: 'Y Mega  Evolution', value: '``/buy mega y``', inline: true })
    embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
    interaction.reply({ embeds: [embed] })
}

// Page 6 Forms
function page_6(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`:moneybag: Balance: ${balance}\n\nForms`)
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription(`Some pokémon have different forms, you can buy items here to allow them to transform.\n\n**All form items cost 1000 credits.**`)
    for (i = 0; i < forms_config.available_pokemons.length; i++) {
        embed.addFields({ name: forms_config.available_pokemons[i], value: '``/shop forms ' + forms_config.available_pokemons[i].toLocaleLowerCase() + '``', inline: true })
    }
    embed.setFooter({ text: "Need more credits ? Win duels or vote for the bot using the /daily command!" })
    interaction.reply({ embeds: [embed] })
}

// Page 7 Evs
function page_7(interaction, balance) {
    var embed = new Discord.EmbedBuilder()
    embed.setTitle(`Evs`);
    embed.setColor(interaction.member.displayHexColor)
    embed.setDescription(`Wings cost 20c each, Berries cost 50c each and Vitamins cost 150c each. Do /buy vitamin/berry/wing <type> to buy the item!`)
    embed.addFields({ name: 'Health Wing', value: `Increases the hp EV of your selected pokemon by 1, Do \`/buy wing health\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Muscle Wing', value: `Increases the attack EV of your selected pokemon by 1, Do \`/buy wing muscle\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Resist Wing', value: `Increases the defense EV of your selected pokemon by 1, Do \`/buy wing resist\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Genius Wing', value: `Increases the special attack EV of your selected pokemon by 1, Do \`/buy wing genius\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Clever Wing', value: `Increases the special defense EV of your selected pokemon by 1, Do \`/buy wing clever\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Swift Wing', value: `Increases the speed EV of your selected pokemon by 1 Do \`/buy wing swift\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Hp-Up', value: `Increases the hp EV of your selected pokemon by 10 Do \`/buy vitamin hp-up\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Protein', value: `Increases the attack EV of your selected pokemon by 10 Do \`/buy vitamin protein\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Iron', value: `Increases the defense EV of your selected pokemon by 10 Do \`/buy vitamin iron\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Calcium', value: `Increases the special attack EV of your selected pokemon by 10 Do \`/buy vitamin calcium\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Zinc', value: `Increases the special defense EV of your selected pokemon by 10 Do \`/buy vitamin zinc\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Carbos', value: `Increases the speed EV of your selected pokemon by 10 Do \`/buy vitamin carbos\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Pomeg Berry', value: `Decreases the hp EV of your selected pokemon by 10 Do \`/buy berry pomeg\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Kelpsy Berry', value: `Decreases the attack EV of your selected pokemon by 10 Do \`/buy berry kelpsy\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Qualot Berry', value: `Decreases the defense EV of your selected pokemon by 10 Do \`/buy berry qualot\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Hondew Berry', value: `Decreases the special attack EV of your selected pokemon by 10 Do \`/buy berry hondew\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Grepa Berry', value: `Decreases the special defense EV of your selected pokemon by 10 Do \`/buy berry grepa\` to buy this item!`, inline: true })
    embed.addFields({ name: 'Tamato Berry', value: `Decreases the speed EV of your selected pokemon by 10 Do \`/buy berry tamato\` to buy this item!`, inline: true })
    interaction.reply({ embeds: [embed] })
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
    description: "Shop, where you can buy something useful.",
    options: [{
        name: "page",
        description: "Page to show.",
        type: 3,
        min_length: 1
    }, {
        name: "forms",
        description: "Form to show.",
        type: 3,
        min_length: 1
    }],
    aliases: []
}