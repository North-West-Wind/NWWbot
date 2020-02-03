const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
module.exports = {
  name: "ban",
  description: "Ban someone",
  args: true,
  usage: "<user> [reason]",
  execute(message, args) {
    if (!message.member.hasPermission("BAN_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if(!message.guild.me.hasPermission('BAN_MEMBERS')) {
      message.channel.send(`I don\'t have the permission to ban members.`)
      return;
    }
    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):

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

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions

    message.channel.client.fetchUser(userID).then(user => {
        // Now we get the member from the user
        if(args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.ban(user, { reason: reason });
        } else {
          var member = message.guild.ban(user);
        }
        // If the member is in the guild
        if (member) {
          /**
           * Ban the member
           * Make sure you run this on a member, not a user!
           * There are big differences between a user and a member
           * Read more about what ban options there are over at
           * https://discord.js.org/#/docs/main/master/class/GuildMember?scrollTo=ban
           */
          message.delete();
          member
            .then(() => {
              // We let the message author know we were able to ban the person

              var banEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
                .setColor(color)
                .setTitle(`You've been banned`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Banned by " + message.author.tag,
                  message.author.displayAvatarURL
                );
              if (args[1]) {
                banEmbed.addField("Reason", reason);
              }
              user.send(banEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username)
              });

              var banSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
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
              // An error happened
              // This is generally due to the bot not being able to ban the member,
              // either due to missing permissions or role hierarchy
              message.channel.send("I failed to ban this member!");
              // Log the error
              console.error(err);
            });
        } else {
          // The mentioned user isn't in this guild
          message.channel.send("that user doesn't exist!");
        }
      
    }).catch(err => {
      return message.channel.send("I cannot find this member!")
    });
    // If we have a user mentioned
  }
};
