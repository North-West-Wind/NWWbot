const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "kick",
  description: "Kick a member of the server.",
  args: true,
  usage: "<user | user ID> [reason]",
  category: 1,
  execute(message, args) {
    if (!message.member.permissions.has(2)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has(2)) {
      message.channel.send(
        `I don\'t have the permission to kick members.`
      );
      return;
    }
    
    if (!message.guild) return;
    
    if(!args[0]) {
      return message.channel.send("You didn't mention any user!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``)
    }
   
    if(isNaN(parseInt(args[0]))) {
      if (!args[0].startsWith("<@")) {
        return message.channel.send(
          "**" + args[0] + "** is neither a mention or ID."
        );
      }
    }

    const userID = args[0]
      .replace(/<@/g, "")
      .replace(/!/g, "")
      .replace(/>/g, "");
    
    
    message.channel.client.users.fetch(userID).then(async user => {
      const member = message.guild.member(user);
      // If the member is in the guild
      if (member) {
        
        
        
        if(args[1]) {
          await member.kick(args.slice(1).join(" "))
          var reason = args.slice(1).join(" ")
        } else {
          await member.kick()
        }
        
          user.kicked = new Discord.Collection()
           await user.kicked.set(message.guild.id, true)
            var kickEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(`You've been kicked`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Kicked by " + message.author.tag,
                  message.author.displayAvatarURL()
                );
              if (args[1]) {
                kickEmbed.addField("Reason", reason);
              }
              user.send(kickEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username)
              });

              var kickSuccessfulEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("User Kicked!")
                .setDescription(
                  "Kicked **" +
                    user.tag +
                    "** in server **" +
                    message.guild.name +
                    "**."
                );
              return message.author.send(kickSuccessfulEmbed);
          
      } else {
        message.reply("That user doesn't exist!");
      }
    });
  }
};
