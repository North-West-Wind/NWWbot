const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");
module.exports = {
  name: "ban",
  description: "Ban a member of the server.",
  args: true,
  usage: "<user | user ID> [reason]",
  category: 1,
  execute(message, args) {
    if (!message.member.permissions.has(4)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if(!message.guild.me.permissions.has(4)) {
      message.channel.send(`I don\'t have the permission to ban members.`)
      return;
    }
    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):

    if (!message.guild) return;
    
    if(!args[0]) {
      return message.channel.send("You didn't mention any user!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``)
    }
    
    
   
    findUser(message, args[0]).then(async user => {
      
      if(!user) return;
        if(args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.members.ban(user, { reason: reason });
        } else {
          var member = message.guild.members.ban(user);
        }
        if (member) {
          
          user.kicked = new Discord.Collection()
           await user.kicked.set(message.guild.id, true)
          member
            .then(() => {
              var banEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(`You've been banned`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Banned by " + message.author.tag,
                  message.author.displayAvatarURL()
                );
              if (args[1]) {
                banEmbed.addField("Reason", reason);
              }
              user.send(banEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username)
              });
              var banSuccessfulEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("User Banned!")
                .setDescription(
                  "Banned **" +
                    user.tag +
                    "** in server **" +
                    message.guild.name +
                    "**."
                );
              return message.author.send(banSuccessfulEmbed);
            })
            .catch(err => {
              message.channel.send("I failed to ban this member!");
              console.error(err);
            });
        } else {
          message.channel.send("That user doesn't exist!");
        }
      
    }).catch(err => {
      return message.channel.send("I cannot find this member!")
    });
  }
};
