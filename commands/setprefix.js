const guildModel = require("../models/guild")

module.exports.run = async (bot, message, args) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.channel.send("You are not allowed to change the bot's prefix!");
    }

    const data = await guildModel.findOne({
        GuildID: message.guild.id
    });

    if (!args[0]) return message.channel.send('You must provide a **new prefix**!');

    if (args[0].length > 5) return message.channel.send('Your new prefix must be under \`5\` characters!')

    if (data) {
        //    await guildModel.findOneAndUpdate({
        //      GuildID: message.guild.id
        //   })

        guildModel.findOneAndUpdate({ GuildID: message.guild.id }, { Prefix: args[0] }, function (err, user) {
            if(err){console.log(err)}
        });

        message.channel.send(`The new prefix is now **\`${args[0]}\`**`);

        //   let newData = new guildModel({
        //       Prefix: args[0],
        //       GuildID: message.guild.id
        //   })
        //  newData.save();
    }
}

module.exports.config = {
    name: "setprefix",
    aliases: []
}
