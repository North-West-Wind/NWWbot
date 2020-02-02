const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "unban",
  description: "Unban a user.",
  usage: "<user|id> [reason]",
  execute(message, args) {
     if (!message.member.hasPermission("BAN_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
   

    if (!message.guild) return;

    message.delete();
    
    const userID = args[0]
      .replace(/<@/g, "")
      .replace(/!/g, "")
      .replace(/>/g, "");


    message.client.fetchUser(userID).then(user => {
      if (user) {
        // Now we get the member from the user
        if(args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.unban(user, reason);
        } else {
          var member = message.guild.unban(user);
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
          member
            .then(() => {
              // We let the message author know we were able to ban the person

              var unbanEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
                .setColor(color)
                .setTitle(`You've been unbanned`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Banned by " + message.author.tag,
                  message.author.displayAvatarURL
                );
              if (args[1]) {
                unbanEmbed.addField("Reason", reason);
              }
              user.send(unbanEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username)
              });

              var unbanSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
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
              // An error happened
              // This is generally due to the bot not being able to ban the member,
              // either due to missing permissions or role hierarchy
              message.reply("I failed to ban this member!");
              // Log the error
              console.error(err);
            });
        } else {
          // The mentioned user isn't in this guild
          message.reply("that user doesn't exist!");
        }
      } else {
        // Otherwise, if no user was mentioned
        message.reply("you should tell me who is bad.");
      }
    })
  }
}