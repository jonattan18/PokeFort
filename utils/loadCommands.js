const readdirp = require('readdirp');
const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const config = require("../config/config.json");

const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);

function loadCommands(bot) {
    (async () => {
        try {
            var commmand_body = [];
            readdirp('commands/', { fileFilter: '*.js' }).on('data', (files) => {
                const pull = require(`../commands/${files.path}`);
                if (pull.config.description != undefined) {
                    bot.commands.set(pull.config.name, pull);
                    commmand_body.push({
                        name: pull.config.name,
                        description: pull.config.description,
                        options: pull.config.options,
                    });
                }
            }).on('end', () => {
                rest.put(Discord.Routes.applicationCommands(bot.user.id), { body: commmand_body })
            });
        } catch (error) {
            console.error(error);
        }
    })();
}

module.exports = { loadCommands }