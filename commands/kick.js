const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "kick",
  description: "Kick someone",
  args: true,
  usage: "<user> [reason]",
  execute(message, args) {
    if (!message.member.hasPermission("KICK_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions
    const user = message.mentions.users.first();
    // If we have a user mentioned
    if (user) {
      // Now we get the member from the user
      const member = message.guild.member(user);
      // If the member is in the guild
      if (member) {
        /**
         * Kick the member
         * Make sure you run this on a member, not a user!
         * There are big differences between a user and a member
         */
        member
          .kick(`${args[1]}`)
          .then(() => {
            // We let the message author know we were able to kick the person
            const Embed = new Discord.RichEmbed()
              .setTitle("Kicked user")
              .setDescription(user.tag)
              .setColor(color)
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                "https://i.imgur.com/hxbaDUY.png"
              );
            message.channel.send(Embed);
          })
          .catch(err => {
            // An error happened
            // This is generally due to the bot not being able to kick the member,
            // either due to missing permissions or role hierarchy
            message.reply("I cannot kick the member");
            // Log the error
            console.error(err);
          });
      } else {
        // The mentioned user isn't in this guild
        message.reply("That user doesn't exist!");
      }
      // Otherwise, if no user was mentioned
    } else {
      message.reply("Who should I kick?");
    }
  }
};
