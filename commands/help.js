const Discord = require('discord.js'); // Import Discord

module.exports.run = async (bot, message, args, prefix) => {

    if (args.length == 0) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("PokeFort Commands");
        var description = ""
            + `**Page 1 | Getting Started!**\n`
            + `How to get started on the bot and dex commands. \`\`${prefix}help 1\`\`\n\n`
            + `**Page 2 | Basic Commands!**\n`
            + `The main commands for the bot and pokemon commands. \`\`${prefix}help 2\`\`\n\n`
            + `**Page 3 | Trading!**\n`
            + `How to trade pokémon, redeems and credits on the bot. \`\`${prefix}help 3\`\`\n\n`
            + `**Page 4 | Market!**\n`
            + `How to buy and sell pokémon using the market. \`\`${prefix}help 4\`\`\n\n`
            + `**Page 5 | Search Options!**\n`
            + `Search options for market searching. \`\`${prefix}help 5\`\`\n\n`
            + `**Page 6 | Shop and Others!**\n`
            + `Shop commands and some misc commands. \`\`${prefix}help 6\`\`\n\n`
            + `**Page 7 | Dueling!**\n`
            + `How to duel with your pokémon. \`\`${prefix}help 7\`\`\n\n`
            + `**Page 8 | Bot and Server commands!**\n`
            + `Bot commands and server commands. \`\`${prefix}help 8\`\`\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 1) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Getting Started!");
        var description = "How to get started on the bot and dex commands.\n\n"
            + `**${prefix}start** | This enters you into the game. You have to use this command first before you can catch any Pokemon.\n\n`
            + `**${prefix}pick** | Once you've done the start command. You can pick from any of the starters across all of the generations.\n\n`
            + `**${prefix}catch** <Pokemon Name> | When a wild Pokemon spawns, you will use this command and the correct name to catch it.\n\n`
            + `**${prefix}hint** | Will display a hint to the currently spawned Pokemon.\n\n`
            + `**${prefix}select** <Pokemon Number> | Selects which Pokemon will receive XP from chatting and which will battle.\n\n`
            + `**${prefix}select latest** | Selects your most recently caught or redeemed Pokemon.\n\n`
            + `**${prefix}nickname** <nickname> | Gives a nickname to your selected Pokemon.\n\n`
            + `**${prefix}info** | Displays the information of your SELECTED Pokemon.\n\n`
            + `**${prefix}info latest** | Displays the information of the LATEST Pokemon you've caught.\n\n`
            + `**${prefix}info** <Pokemon Number> | Displays the information of the Pokemon attached to this number.\n\n`
            + `**${prefix}dex** <Pokemon Name> | Display a Pokemon with its base stats.\n\n`
            + `**${prefix}dex shiny** <Pokemon Name> | Displays a shiny version of a Pokemon with its base stats.\n\n`
            + `**${prefix}dex** | Displays your Pokedex.\n\n`
            + `**${prefix}dex --caught** | Displays the caught Pokemon.\n\n`
            + `**${prefix}dex --uncaught** | Displays the uncaught Pokemon.\n\n`
            + `**${prefix}dex --rewards** | Displays all your dex rewards.\n\n`
            + `**${prefix}dex claim** <Reward Name> | Collects the specified reward.\n\n`
            + `**${prefix}dex claim all** | Collects all your dex rewards.\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 2) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Basic Commands!");
        var description = "The main commands for the bot and pokemon commands.\n\n"
            + `**${prefix}daily** | Allows you to vote for the Pokefort server on the Discord Bots site. You get 100 - 1000 credit for doing this every 12 hours.\n\n`
            + `**${prefix}silence** | Toggles your level up messages.\n\n`
            + `**${prefix}dm** | Toggles your duel instruction messages.\n\n`
            + `**${prefix}redeem** <Pokemon Name> | If you have a redeem available, you will receive a Pokemon of the name you entered.\n\n`
            + `**${prefix}redeem credits** | Sells a redeem you own for 15,000 credits back to the bot itself.\n\n`
            + `**${prefix}redeemspawn** <Pokemon Name> | Spawns the given pokemon in the channel using your redeem.\n\n`
            + `**${prefix}pokemon** | Displays a list of your Pokemon. It also displays information, such as Level, Number, IVs, and Nickname.\n\n`
            + `**${prefix}pokemon --name** <Pokemon Name> | Displays a list of Pokemon you own of that particular name.\n\n`
            + `**${prefix}pokemon --shiny** | Displays your shiny Pokemon.\n\n`
            + `**${prefix}pokemon --legendary** | Displays your legendary Pokemon.\n\n`
            + `**${prefix}pokemon --mythical** | Displays your mythical Pokemon.\n\n`
            + `**${prefix}pokemon --ultrabeast** | Displays your ultra beast Pokemon.\n\n`
            + `**${prefix}pokemon --alolan** | Displays your alolan Pokemon.\n\n`
            + `**${prefix}pokemon --galarian** | Displays your galarian Pokemon.\n\n`
            + `**${prefix}pokemon --nickname** <Nickname> | Displays your specific Pokemon with that nickname.\n\n`
            + `**${prefix}pokemon --level** <Value> | Displays your Pokemon with that level.\n\n`
            + `**${prefix}pokemon --level < / > <Value>** | Displays your Pokemon In-between that filter.\n\n`
            + `**${prefix}pokemon --iv <Value> or --iv < / > <Value>** | Displays your Pokemon with or In-between that filter.\n\n`
            + `**${prefix}pokemon --hpiv/attackiv/defenceiv/specialattackiv/specialdefenceiv/speediv <Value> or --hpiv/attackiv/defenceiv/specialattackiv/specialdefenceiv/speediv < / > <Value>** | Displays your Pokemon with or In-between that filter.\n\n`
            + `**${prefix}pokemon --type** <Type name> | Displays your Pokemon of that type.\n\n`
            + `**${prefix}pokemon --triple/quadra/penta** <Value> | Displays your Pokemon with triple/quadra/penta max iv (31) or min iv (0). Value = 31/0\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 3) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Trading!");
        var description = "How to trade pokémon, redeems and credits on the bot.\n\n"
            + `**${prefix}trade @User** | Begins a trade with someone. They will then have to do ${prefix}accept to do the trade or ${prefix}deny to reject it.\n\n`
            + `**${prefix}p add** <Pokemon numbers, seperated by spaces> | Add one or multiple Pokemon to your trade offer.\n\n`
            + `**${prefix}p remove** <Pokemon numbers, seperated by spaces> | Remove one or multiple Pokemon from your trade offer.\n\n`
            + `**${prefix}c add** <Amount> | Add credits to your trade offer.\n\n`
            + `**${prefix}c remove** <Amount> | Remove credits from your trade offer.\n\n`
            + `**${prefix}r add** <Amount> | Add a redeem to your trade offer.\n\n`
            + `**${prefix}r remove** <Amount> | Remove a redeem from your trade offer.\n\n`
            + `**${prefix}confirm** | Confirm the trade, both users must confirm for the trade to go through.\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 4) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Market!");
        var description = "How to buy and sell pokémon using the market.\n\n"
            + `**${prefix}market search** <Page number> | Show the requested page of the market.\n\n`
            + `**${prefix}market search** <Page number> <Search Options> <Order Option> | Search the market.\n\n`
            + `**${prefix}market view** <Pokemon ID> | View detailed information for a Pokemon on the market.\n\n`
            + `**${prefix}market info** <Pokemon ID> | Alternative to view.\n\n`
            + `**${prefix}market list** <Pokemon Number> <Price> | List a pokémon on the market.\n\n`
            + `**${prefix}market buy** <Pokemon ID> | Buy a Pokemon from the market. You will need to confirm your purchase with ${prefix}confirmbuy or cancel it with ${prefix}cancel.\n\n`
            + `**${prefix}market remove** <Pokemon ID> | Remove one of your Pokemon from the market.\n\n`
            + `**${prefix}market listings** <Page number> | Display the Pokemon you have listed on the market.\n\n`
            + `**Order Options**\n\n`
            + `--order id ascending/descending | Order results by Pokemon ID.\n\n`
            + `--order lvl ascending/descending | Order results by Pokemon level.\n\n`
            + `--order price ascending/descending | Order results by price.\n\n`
            + `--order iv ascending/descending | Order by the sum of the Pokemon's IVs.\n\n`
            + `--order name ascending/descending | Order results by name.\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 5) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Search Options!");
        var description = "Search options for market searching.\n\n"
            + `**--name** <name> | Search for Pokemon by name\n\n`
            + `**--level** <level> or < / > <level> | Search for Pokemon by level.\n\n`
            + `**--holding** <holding> | Search for Pokemon by the item they are holding.\n\n`
            + `**--type** <type> | Search for Pokemon by type.\n\n`
            + `**--price** <price> or < / > <price>  | Search for Pokemon with a specific price.\n\n`
            + `**--hpiv** <IV> or < / > <IVl> | Search for Pokemon by their HP IV.\n\n`
            + `**--atkiv** <IV> or < / > <IV> | Search for Pokemon by their Attack IV.\n\n`
            + `**--defiv** <IV> or < / > <IV> | Search for Pokemon by their Defense IV.\n\n`
            + `**--spatkiv** <IV> or < / > <IV> | Search for Pokemon by their Special Attack IV.\n\n`
            + `**--spdefiv** <IV>or < / > <IV> | Search for Pokemon by their Special Defense IV.\n\n`
            + `**--speediv** <IV> or < / > <IV> | Search for Pokemon by their Speed IV.\n\n`
            + `**--shiny** | Search for shiny Pokemon. \n\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 6) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Shop and Others!");
        var description = "Shop commands and some misc commands.\n\n"
            + `**${prefix}shop** | Opens the shop menu. You can purchase XP Boosters, Rare Candies, Rare Stones, Evolution Items, Nature Modifiers, Held Items, and Mega Evolutions!\n\n`
            + `**${prefix}buy** <Item ID> | Purchases an item from the shop.\n\n`
            + `**${prefix}dropitem** | Drops the item which your current Pokemon is holding.\n\n`
            + `**${prefix}mega** | Command to evolve Pokemon to a Mega X or Y. You must have a Mega Evolution purchased, they cost 1,000 credits each.\n\n`
            + `**${prefix}release** <Pokemon Number> | This will release a Pokemon.  ${prefix}release  will attempt to release your selected Pokemon, confirmation prompt will be displayed beforehand.\n\n`
            + `**${prefix}recycle** <Pokemon Number> | This will recycle the number of Pokemon. By recycling, the selected pokemon level ups.\n\n`
            + `**${prefix}fav** | This will show a list of your favorite Pokemon!\n\n`
            + `**${prefix}addfav** <Pokemon Number> | Adds a Pokemon to your favorites list.\n\n`
            + `**${prefix}removefav** <Pokemon Number> | Removes a Pokemon from your favorites list.\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 7) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Dueling!");
        var description = "How to duel with your pokémon.\n\n"
            + `**${prefix}select** <Pokemon Number> | This will be the Pokemon you use in battle.\n\n`
            + `**${prefix}moves** | Displays your selected Pokemon's current moves, and the available moves it can learn.\n\n`
            + `**${prefix}learn** <Move> | Attempts to learn the move you've chosen. You will need to choose which move you want to replace.\n\n`
            + `**${prefix}replace** <Number> | Replaces a current move with the one you are trying to learn.\n\n`
            + `**${prefix}duel** <@Username> | Challenges the select Discord user to a Duel. Be sure to @ them and not just type in their name.\n\n`
            + `**${prefix}accept** | Accepts a duel if you've been challenged.\n\n`
            + `**${prefix}use** <Move Number> | Your selected Pokemon will use the move that is listed by that number. \n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
    else if (isInt(args[0]) && args.length == 1 && args[0] == 8) {
        message.channel.send("We have sent the instructions to you. Check your DMs!");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Bot and Server commands!");
        var description = "Bot commands and server commands.\n\n"
            + `**${prefix}botinfo** | Shows general bot information.\n\n`
            + `**${prefix}invite** | Gives the bot's invite link.\n\n`
            + `**${prefix}donate** | Sends a link to donate to support the bot.\n\n`
            + `**${prefix}server** | Sends an invite to the bot's official server.\n\n`
            + `**${prefix}appeal** | (Official Server Only) Attempts to give you unbanned from the official server if you were banned for a reason.\n\n`
            + `**Server Commands**\n\n`
            + `**${prefix}setprefix** <prefix> | Sets server prefix.\n\n`
            + `**${prefix}redirect** <#Channel Name> | If you want Pokemon to spawn in a certain channel you can use this command to change it.\n\n`
            + `**${prefix}redirect disable** | If you want to enable spawns in all channels again, you can use this command.\n\n`
            + `**${prefix}channel enable/disable** | Enables or disables ${prefix} commands in the channel you are currently in.\n\n`
            + `**${prefix}levelup enable/disable** | Enables or disables level up alerts.\n\n`
            + `**${prefix}clearspawns enable/disable** | Enables or disables the deletion of spawn message once a Pokemon is caught.\n\n`
        embed.setDescription(description);
        embed.setFooter(`Need more help? Join the official server by using the ${prefix}server command!`);
        message.author.send(embed);
    }
}

// Check if its int
function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

module.exports.config = {
    name: "help",
    aliases: []
}