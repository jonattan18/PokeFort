const readdirp = require('readdirp');

function loadCommands(bot) {
    readdirp('commands/', { fileFilter: '*.js' }).on('data', (files) => {
        const pull = require(`../commands/${files.path}`);
        bot.commands.set(pull.config.name, pull);
        pull.config.aliases.forEach(alias => {
            bot.aliases.set(alias, pull.config.name);
        });
    });
}

module.exports = { loadCommands }