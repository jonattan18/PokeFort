module.exports.run = async (bot, message, args) => {

    message.channel.send(`Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(bot.ws.ping)}ms`);
}

module.exports.config = {
    name: "ping",
    aliases: []
}