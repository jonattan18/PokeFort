const guildModel = require("../models/guild")

module.exports.run = async (bot, message, args) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.channel.send("You are not allowed to change the bot's redirect channel!");
    }

    const data = await guildModel.findOne({
        GuildID: message.guild.id
    });

    if (!args[0]) return message.channel.send('You must tag a channel!');
    if (args.length > 2) return message.channel.send('Please tag one channel alone!')

    if (data) {

        message.channel.send(args)
      //  guildModel.findOneAndUpdate({ GuildID: message.guild.id }, { Prefix: args[0] }, function (err, user) {
      //      if(err){console.log(err)}
      //  });

        message.channel.send(`The new prefix is now **\`${args[0]}\`**`);

    }
}

module.exports.config = {
    name: "redirect",
    aliases: []
}
