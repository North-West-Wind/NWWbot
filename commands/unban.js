const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");

module.exports = {
  name: "unban",
  description: "Unban a member of the server.",
  usage: "<user | user ID> [reason]",
  args: true,
  category: 1,
  execute(message, args) {
    if (!message.member.permissions.has(4)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }

    if (!message.guild) return;

    if(!args[0]) {
      return message.channel.send("You didn't mention any user!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    
    message.delete();
    
    findUser(message, args[0])
      .then(user => {
      
      if(!user) return;
        if (args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.members.unban(user, reason);
        } else {
          var member = message.guild.members.unban(user);
        }
        if (member) {
          member
            .then(() => {
              var unbanEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(`You've been unbanned`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Banned by " + message.author.tag,
                  message.author.displayAvatarURL()
                );
              if (args[1]) {
                unbanEmbed.addField("Reason", reason);
              }
              user.send(unbanEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username);
              });
              var unbanSuccessfulEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("User Unbanned!")
                .setDescription(
                  "Unbanned **" +
                    user.username +
                    "** in server **" +
                    message.guild.name +
                    "**."
                );
              return message.author.send(unbanSuccessfulEmbed);
            })
            .catch(err => {
              message.channel.send("This member is not banned!");
            });
        } else {
          message.channel.send("that user doesn't exist!");
        }
      })
      .catch(err => {
        return message.channel.send("I cannot find this member!");
      });
  }
};
