const user_model = require('../../models/user');
const Discord = require('discord.js');

//Utils
const admin = require('../../utils/admin');

module.exports.run = async (bot, message, args, prefix, user_available, pokemons) => {
     if (message.isadmin) { message.author = message.mentions.users.first() || message.author; args.shift() } // Admin check
     else return;

     user_model.findOne({ UserID: message.author.id }, (err, user) => {
          if (err) { console.log(err); return; }
          if(!user.Admin) return message.channel.send('Mentioned user is not a admin.');

          var level = admin.getlevel(user.Admin);
          var position = admin.getposition(user.Admin);
          var description = admin.getdesc(user.Admin);
          var role = admin.getrole(user.Admin);
          var footdate = getDateTime();

          // Create embed for user profile
          const embed = new Discord.MessageEmbed()
          embed.setTitle(`${message.author.username}'s Admin Profile`)
          embed.setColor(message.member.displayHexColor)
          embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          embed.setDescription('**Admin level:** ' + level
               + '\n**Position:** ' + position
               + '\n**Role:** ' + role
               + '\n**Description:** ' + description)
          embed.setFooter(`System Time : ${footdate}`)
          message.channel.send(embed);
     });
}

function getDateTime() {
     var now = new Date();
     var year = now.getFullYear();
     var month = now.getMonth() + 1;
     var day = now.getDate();
     var hour = now.getHours();
     var minute = now.getMinutes();
     var second = now.getSeconds();
     if (month.toString().length == 1) {
          month = '0' + month;
     }
     if (day.toString().length == 1) {
          day = '0' + day;
     }
     if (hour.toString().length == 1) {
          hour = '0' + hour;
     }
     if (minute.toString().length == 1) {
          minute = '0' + minute;
     }
     if (second.toString().length == 1) {
          second = '0' + second;
     }
     var dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
     return dateTime;
}


module.exports.config = {
     name: "apf",
     aliases: []
}