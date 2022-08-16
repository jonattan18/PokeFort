const user_model = require('../models/user');
const Discord = require('discord.js');

//Utils
const getPokemons = require('../utils/getPokemon');
const pagination = require('../utils/pagination');
const Mongoose = require('mongoose');

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    user_model.findOne({ UserID: interaction.user.id }, (err, user) => {

        // If no mail found.
        if (user.Mails == undefined || user.Mails.length == 0) return interaction.reply({ content: `You don't have any mail!`, ephemeral: true });

        // Mail sort based on date.
        user.Mails.sort((a, b) => {
            return b.Timestamp - a.Timestamp;
        });


        // If only mail was typed.
        if (interaction.options.get("claim") == null && interaction.options.get("read") == null) {

            var no_of_unread = user.Mails.filter(mail => mail.Read == false).length;
            var chunks = chunkArray(user.Mails, 5);
            var embeds = [];
            var index_number = 1;
            for (i = 0; i < chunks.length; i++) {
                embeds[i] = new Discord.EmbedBuilder()
                    .setTitle(`${interaction.user.username}'s inbox:`);
                embeds[i].setColor("#1ec5ee");
                var description = `You have ${no_of_unread} unread mail(s). Use \`/mail read index\` to read the mail.\n\n`
                for (j = 0; j < chunks[i].length; j++) {
                    var mail_subject = chunks[i][j].Subject;
                    var mail_message = chunks[i][j].Message;
                    var mail_attachment = chunks[i][j].Attachment;
                    var mail_read = chunks[i][j].Read;
                    var mail_sent = chunks[i][j].Timestamp;

                    var sent_time = new Date(mail_sent);
                    var time_diff = diff_hours(new Date(), sent_time);
                    if (mail_subject.length > 25) mail_subject = mail_subject.substring(0, 25) + '...';

                    if (time_diff < 1) var sent_time_string = "Now";
                    else if (time_diff > 1 && time_diff < 24) var sent_time_string = "Today";
                    else if (time_diff > 24 && time_diff < 48) var sent_time_string = "Yesterday";
                    else var sent_time_string = sent_time.getDay() + " " + sent_time.toLocaleString('en-US', { month: 'short' });
                    var index_string = index_number + ". ";

                    description += `**${mail_read ? `~~${index_string}${mail_subject}~~` : `${index_string}${mail_subject}`}** _• ${sent_time_string}_\n`;
                    description += `${" ".repeat(index_string.length)}_${mail_message.substring(0, 37)}..._${mail_attachment.length != 0 ? " 🄰" : ""}\n\n`;
                    index_number++;
                }
                embeds[i].setDescription(description + "‎");
                embeds[i].setFooter({ text: `User Inbox - Page ${i + 1}/${chunks.length}`, iconURL: "https://cdn4.iconfinder.com/data/icons/ios7-active-2/512/Open_mail.png" });
            }
            interaction.reply({ embeds: [embeds[0]], fetchReply: true }).then(msg => {
                if (chunks.length > 1) return pagination.createpage(interaction.channel.id, interaction.user.id, msg.id, embeds, 0);
                else return;
            });
        }

        // If user read the mail.
        else if (interaction.options.get("claim") == null && interaction.options.get("read") != null) {
            var args = interaction.options.get("read").value;

            var usr_selected_mail = user.Mails[args - 1];
            if (usr_selected_mail == undefined) return interaction.reply({ content: `We couldn't found that index.`, ephemeral: true });
            var mail_from = usr_selected_mail.From;
            var mail_subject = usr_selected_mail.Subject;
            var mail_message = usr_selected_mail.Message;
            var mail_attachment = usr_selected_mail.Attachment;
            var mail_claimed = usr_selected_mail.Claimed;
            var sent_time = unixTime(usr_selected_mail.Timestamp);

            var embed = new Discord.EmbedBuilder()
            embed.setTitle(mail_subject);
            embed.setColor("#1ec5ee");
            embed.setFooter({ text: `From ${mail_from} at ${sent_time}`, iconURL: "https://cdn4.iconfinder.com/data/icons/ios7-active-2/512/Open_mail.png" });

            var mail_attachment_string = "";
            if (mail_attachment != undefined) {
                mail_attachment_string = "\n\n_This mails contains following attachments:_\n\n";
                if (mail_claimed) mail_attachment_string += "~~";
                if (mail_attachment.PokeCredits != undefined && mail_attachment.PokeCredits > 0) mail_attachment_string += "⁍ **PokeCredits**: " + mail_attachment.PokeCredits.toLocaleString() + "\n";
                if (mail_attachment.Redeems != undefined && mail_attachment.Redeems > 0) mail_attachment_string += "⁍ **Redeems**: " + mail_attachment.Redeems + "\n";
                if (mail_attachment.Shards != undefined && mail_attachment.Shards > 0) mail_attachment_string += "⁍ **Shards**: " + mail_attachment.Shards + "\n";
                if (mail_attachment.WishingPieces != undefined && mail_attachment.WishingPieces > 0) mail_attachment_string += "⁍ **Wishing Pieces**: " + mail_attachment.WishingPieces + "\n";
                if (mail_attachment.Pokemons != undefined && mail_attachment.Pokemons.length > 0) mail_attachment_string += "⁍ **Pokemons**: " + mail_attachment.Pokemons.length + "\n";
                if (mail_attachment.Badges != undefined && mail_attachment.Badges.length > 0) mail_attachment_string += "⁍ **Badges**: " + mail_attachment.Badges.length + "\n";
                if (mail_claimed) mail_attachment_string += "~~";
                mail_attachment_string += `\nUse \`/mail claim ${args}\` to claim these attachments.\n`;
            }

            embed.setDescription(`${mail_message}${mail_attachment_string}${user.Mails[args - 1].ImageURL == undefined ? "‎" : ""}`);

            if (user.Mails[args - 1].ImageURL != undefined && user.Mails[args - 1].ImageURL != "") {
                embed.setImage(user.Mails[args - 1].ImageURL);
            }

            user.Mails[args - 1].Read = true;
            user.save();
            interaction.reply({ embeds: [embed] });
        }

        // If user claims the message.
        else if (interaction.options.get("claim") != null && interaction.options.get("read") == null) {
            var args = interaction.options.get("claim").value;

            var usr_selected_mail = user.Mails[args - 1];
            if (usr_selected_mail == undefined) return interaction.reply({ content: `We couldn't found that index.`, ephemeral: true });
            var mail_attachment = usr_selected_mail.Attachment;
            var mail_claimed = usr_selected_mail.Claimed;
            var claimed_message = "";

            if (mail_claimed) return interaction.reply({ content: `This mail has already been claimed!`, ephemeral: true });
            else if (mail_attachment == undefined) return interaction.reply({ content: `This mail doesn't have any attachments!`, ephemeral: true });
            else {
                if (mail_attachment.PokeCredits != undefined && mail_attachment.PokeCredits > 0) {
                    user.PokeCredits += mail_attachment.PokeCredits;
                    claimed_message += `**${mail_attachment.PokeCredits.toLocaleString()}** PokeCredits!\n`;
                }
                if (mail_attachment.Redeems != undefined && mail_attachment.Redeems > 0) {
                    user.Redeems += mail_attachment.Redeems;
                    claimed_message += `**${mail_attachment.Redeems}** Redeems!\n`;
                }
                if (mail_attachment.Shards != undefined && mail_attachment.Shards > 0) {
                    user.Shards += mail_attachment.Shards;
                    claimed_message += `**${mail_attachment.Shards}** Shards!\n`;
                }
                if (mail_attachment.WishingPieces != undefined && mail_attachment.WishingPieces > 0) {
                    user.WishingPieces = user.WishingPieces != undefined ? user.WishingPieces + mail_attachment.WishingPieces : mail_attachment.WishingPieces;
                    claimed_message += `**${mail_attachment.WishingPieces}** Wishing Pieces!\n`;
                }
                if (mail_attachment.Badges != undefined && mail_attachment.Badges.length > 0) {
                    user.Badges.push(...mail_attachment.Badges);
                    claimed_message += `**${mail_attachment.Badges.join(",")}** Badges!\n`;
                }
                if (mail_attachment.Pokemons != undefined && mail_attachment.Pokemons.length > 0) {
                    var pokemons_to_add = [];
                    for (var i = 0; i < mail_attachment.Pokemons.length; i++) {
                        var crnt_pokemon = mail_attachment.Pokemons[i];
                        claimed_message += `**Level ${crnt_pokemon.Level} ` + getPokemons.get_pokemon_name_from_id(crnt_pokemon.PokemonId, pokemons, crnt_pokemon.Shiny) + "**\n";
                        let pokemon_data = {
                            _id: new Mongoose.Types.ObjectId(),
                            PokemonId: crnt_pokemon.PokemonId,
                            Experience: crnt_pokemon.Experience,
                            Level: crnt_pokemon.Level,
                            Nature: crnt_pokemon.Nature,
                            IV: crnt_pokemon.IV,
                            Shiny: crnt_pokemon.Shiny,
                            Reason: crnt_pokemon.Reason,
                        }
                        pokemons_to_add.push(pokemon_data);
                    }
                    getPokemons.insertpokemon(interaction.user.id, pokemons_to_add);
                }

                if (user.Mails[args - 1].Read != true) user.Mails[args - 1].Read = true;
                user.Mails[args - 1].Claimed = true;
                user.save().then(() => {
                    var embed = new Discord.EmbedBuilder();
                    embed.setTitle("You have claimed the following attachments:");
                    embed.setColor("#1ec5ee");
                    embed.setDescription(claimed_message);
                    interaction.reply({ embeds: [embed] });
                });
            }
        }

    });

}

function diff_hours(dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(Math.round(diff));
}

// Unix the time
function unixTime(unixtime) {
    var u = new Date(unixtime);
    return ('0' + u.getUTCDate()).slice(-2) +
        '/' + ('0' + u.getUTCMonth()).slice(-2) +
        '/' + u.getUTCFullYear() + " " + u.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
};

// Chunk array into equal parts.
function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
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
    name: "mail",
    description: "View your mail.",
    options: [{
        name: "claim",
        description: "Claim a mail.",
        type: 4,
        min_value: 1,
        max_value: 100
    }, {
        name: "read",
        description: "Read a mail.",
        type: 4,
        min_value: 1,
        max_value: 100
    }],
    aliases: []
}