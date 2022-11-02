const Discord = require('discord.js');
const invitation_model = require('../models/invitation')
const user_model = require('../models/user');

// Config file
const config = require("../config/config.json");

module.exports.run = async (bot, interaction, user_available, pokemons) => {
    if (!user_available) return interaction.reply({ content: `You should have started to use this command! Use /start to begin the journey!`, ephemeral: true });

    if (!interaction.options.get("code")) {
        invitation_model.findOne({ UserID: interaction.user.id }, (err, invitation_code) => {
            if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
            if (!invitation_code) {
                var new_code = generateString(5);
                // Create new invitation code
                invitation_model.create({
                    UserID: interaction.user.id,
                    InvitationCode: new_code,
                    NoOfInvitation: 0,
                    UsedCode: false
                });

                interaction.reply({ content: `Your invitation code is \`${new_code}\`, share this with your friends to get rewards.` });
            }
            else {
                // Display the code
                // Check if the user has invitation code
                if (!invitation_code.InvitationCode) {
                    // Update the code to user
                    var new_code = generateString(5);
                    invitation_code.InvitationCode = new_code;
                    invitation_code.save();
                    interaction.reply({ content: `Your invitation code is \`${new_code}\`, share this with your friends to get rewards.` });
                } else {
                    // Print the code
                    interaction.reply({ content: `Your invitation code is \`${invitation_code.InvitationCode}\`, share this with your friends to get rewards.` });
                }
            }
        });
    } else {

        if (interaction.guild.id != "980822800581406792") {
            // Create an embed to share invitation link
            const embed = new Discord.EmbedBuilder()
            embed.setTitle("Invitation Event");
            embed.setDescription(`This event is held in official server, Join the server to validate the invitation code.\n[Click here to join](${config.OS_INVITE_URL})`)
            return interaction.reply({ embeds: [embed] });
        }

        invitation_model.findOne({ Primary: true }, (err, invitation) => {
            if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
            if (invitation) {
                user_model.findOne({ UserID: interaction.user.id }, (err, user) => {
                    if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
                    if (user) {
                        if (user.Joined < invitation.Timestamp) {
                            return interaction.reply({ content: `Players who joined after this event is eligible for this event.`, ephemeral: true });
                        }
                    }
                });
            } else return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
        });

        // Join the invitation
        invitation_model.findOne({ UserID: interaction.user.id }, (err, invitation_code) => {
            if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
            invitation_model.findOne({ InvitationCode: interaction.options.get("code").value }, (err, valid) => {
                if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
                if (!valid) return interaction.reply({ content: `Unable to match the code, Please try again with new code.`, ephemeral: true });
                if (interaction.user.id == valid.UserID) return interaction.reply({ content: `You can't type your own code.`, ephemeral: true });
                if (!invitation_code) {
                    invitation_model.create({
                        UserID: interaction.user.id,
                        UsedCode: true
                    });
                    send_invitation_message(valid);
                }
                else {
                    if (invitation_code.UsedCode) return interaction.reply({ content: `You can enter invitation code only once.` });
                    else {
                        // Use the invitation code
                        invitation_code.UsedCode = true;
                        invitation_code.save();
                        send_invitation_message(valid);
                    }
                }
            });
        });

        function send_invitation_message(invitor) {
            if (!invitor.NoOfInvitation) invitor.NoOfInvitation = 0;
            invitor.NoOfInvitation += 1;
            invitor.InvitedPerson.push([interaction.user.tag, interaction.user.id]);
            invitor.save();
            user_model.findOne({ UserID: invitor.UserID }, (err, user) => {
                if (err) return interaction.reply({ content: `Something went wrong.`, ephemeral: true });
                var suffix = ".";
                user.PokeCredits += 1000;
                if ([10, 20, 30, 40, 50, 60, 70, 80].includes(invitor.NoOfInvitation)) {
                    user.Redeems += 1;
                    suffix = " and 1 redeem."
                }
                user.save();
                interaction.reply({ content: `Thanks for joining PokeFort, We validated your invitation code.` });
                bot.users.fetch(invitor.UserID).then((dm) => {
                    dm.send({ content: `Greetings, \`${interaction.user.tag}\` has joined PokeFort using your invitation code, You have earned 1000 pokecredits${suffix}` });
                })
            });
        }
    }

}

// program to generate random strings
// declare all characters
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.config = {
    name: "invitation",
    description: "Invitation event",
    options: [{
        name: "code",
        description: "Enter your friend's invitation code here.",
        type: 3,
        min_length: 5,
        max_length: 5
    }],
    aliases: []
}