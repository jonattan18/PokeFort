// Models
const user_model = require('../models/user');

// Discord
const Discord = require('discord.js');

module.exports.run = async (bot, message, args, prefix, user_available) => {
    if (!user_available) { message.channel.send(`You should have started to use this command! Use ${prefix}start to begin the journey!`); return; }
    return;

    if (args.length == 0) {
        user_model.findOne({ UserID: message.author.id }, (err, user) => {
            if (user) {
                var total_pokemons_caught = user.TotalCaught;
                var total_duels = user.TotalDueled || 0;
                var total_bugs_reported = user.TotalBugsReported || 0;

                // Participated in raids
                var participated_in_raids_easy = user.Raids.Spawned.Easy || 0;
                var participated_in_raids_normal = user.Raids.Spawned.Normal || 0;
                var participated_in_raids_hard = user.Raids.Spawned.Hard || 0;
                var participated_in_raids_challenge = user.Raids.Spawned.Challenge || 0;
                var participated_in_raids_intense = user.Raids.Spawned.Intense || 0;
                var participated_in_raids = participated_in_raids_easy + participated_in_raids_normal + participated_in_raids_hard + participated_in_raids_challenge + participated_in_raids_intense;

                // Calculate days and hours passed since user joined.
                var days_passed = Math.floor((Date.now() - user.Joined) / (1000 * 60 * 60 * 24));
                var total_time_passed = `${days_passed} Days`;

                // Check if user is in OS.
                var is_there = "No";
                bot.guilds.fetch("980822800581406792").then(guild => {
                    guild.members.fetch(message.author.id).then(member => {
                        if (member) {
                            is_there = "Yes";
                        } else {
                            is_there = "No";
                        }
                    }).catch(err => {
                        is_there = "No";
                    });
                }).catch(err => {
                    is_there = "No";
                }).finally(() => {
                    // Create embed.

                    var embed = new Discord.MessageEmbed();
                    embed.setTitle(`${message.author.username}'s Beta Card`);
                    embed.setColor("#FFD700");
                    embed.setThumbnail(message.author.avatarURL());

                    var description = `**What have you done?**\n\n`;
                   // description += `⎆ Joined Official Server: ${is_there}!\n`;
                    description += `⎆ Caught **${total_pokemons_caught}** Pokemon!\n`;
                    description += `⎆ Participated in **${participated_in_raids}** Raids!\n`;
                    description += `⎆ Dueled **${total_duels}** times!\n`;
                    description += `⎆ Reported **${total_bugs_reported}** Bugs!\n`;
                    description += `⎆ Active for **${total_time_passed}**!\n`;
                    description += `⎆ Credits: **1,024** 💰!\n\n`;

                    description += `**What you will get?**\n\n`;

                    description += `◻️ ➟ _Beta Badge 😚 (For All)_\n`;
                    description += `◻️\n`;
                    description += `◻️ ➟ _Ultra Beast 😋_\n`;
                    description += `◻️\n`;
                    description += `◻️ ➟ _Legendary 😇_\n`;
                    description += ` ::::\n`;
                    description += ` :::: ➟ _Mythical 🥰_\n`;
                    description += ` ::::\n`;
                    description += ` :::: ➟ _Redeem 🥵_\n`;
                    description += ` ::::\n`;
                    description += ` :::: ➟ _Choose any 1 kit 😮_\n`;
                    description += ` ::::\n`;
                    description += ` :::: ➟ _Choose any 2 stuff from here. Except this 🤯_\n\n`;
                    description += `_Use  \`.beta kits\` to take a look at all the kits._`;

                    embed.setDescription(description);
                    embed.setFooter('Beta Card #OnlyForBetaUsers');
                    message.channel.send(embed);
                });
            }
        });
    }
    else if (args.length == 1 && args[0].toLowerCase() == "kits") {
        var embed = new Discord.MessageEmbed();
        embed.setTitle(`Available Beta Kits`);
        embed.setColor("#FFD700");

        var description = "";
    }

}

module.exports.config = {
    name: "beta",
    aliases: []
}