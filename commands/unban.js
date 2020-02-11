const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "unban",
  description: "Unban a user.",
  usage: "<user|id> [reason]",
  execute(message, args) {
    if (!message.member.permissions.has("BAN_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }

    if (!message.guild) return;

    if (isNaN(parseInt(args[0]))) {
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

    message.client
      .users.fetch(userID)
      .then(user => {
        // Now we get the member from the user
        if (args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.members.unban(user, reason);
        } else {
          var member = message.guild.members.unban(user);
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

              var unbanEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
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

              var unbanSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
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
              message.channel.send("This member is not banned!");
              // Log the error
            });
        } else {
          // The mentioned user isn't in this guild
          message.channel.send("that user doesn't exist!");
        }
      })
      .catch(err => {
        return message.channel.send("I cannot find this member!");
      });
  }
};
