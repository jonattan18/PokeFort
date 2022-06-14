module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    if (args.length != 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to raid.`); }
    if (isInt(args[0]) == false) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to raid`); }
    if (args[0] > 6 || args[0] < 1) { return message.channel.send(`Invalid Syntax. Use ${prefix}help to know how to raid.`); }


    const commandfile = bot.commands.get("use") || client.commands.get(client.aliases.get("use"));
    if (!commandfile) return message.channel.send(`Invalid Command.`);
    return commandfile.run(bot, message, args, prefix, user_available, pokemons, true);

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
    name: "switch",
    aliases: []
}
