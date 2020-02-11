const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "kick",
  description: "Kick someone",
  args: true,
  usage: "<user> [reason]",
  execute(message, args) {
    if (!message.member.permissions.has("KICK_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has("KICK_MEMBERS")) {
      message.channel.send(
        `I don\'t have the permission to kick members.`
      );
      return;
    }
    
    if (!message.guild) return;
    
    if(!args[0]) {
      return message.channel.send("You didn't mention any user!")
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
        
          
            // We let the message author know we were able to kick the person
            var kickEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
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

              var kickSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
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
        // The mentioned user isn't in this guild
        message.reply("That user doesn't exist!");
      }
    })
      // Now we get the member from the user
      
      // Otherwise, if no user was mentioned
    
  }
};
