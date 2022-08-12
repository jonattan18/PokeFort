module.exports.run = async (bot, interaction) => {
    interaction.reply({ content: "Working on it!", fetchReply: true }).then((first) => {
        interaction.editReply(`🏓 Latency is ${first.createdTimestamp - interaction.createdTimestamp} ms. API Latency is ${Math.round(bot.ws.ping)}ms`);
    });
}

module.exports.config = {
    name: "ping",
    description: "Wanna play ping pong ?",
    aliases: []
}