const Discord = require("discord.js");
const { findMember } = require("../function.js");
module.exports = {
  name: "kick",
  description: "Kick a member from the server.",
  args: 1,
  usage: "<user | user ID> [reason]",
  category: 1,
  execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(2)) return message.channel.send(`You don\'t have the permission to use this command.`);
    if (!message.guild.me.permissions.has(2)) return message.channel.send(`I don\'t have the permission to kick members.`);
    const member = await findMember(message, args[0]);
    if (!member) return;
    if (args[1]) {
      var reason = args.slice(1).join(" ")
      await member.kick(reason)
    } else {
      await member.kick()
    }
    var kickEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
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
    user.send(kickEmbed).catch(() => {
      console.log("Failed to send DM to " + user.username)
    });

    var kickSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("User Kicked!")
      .setDescription(
        "Kicked **" +
        user.tag +
        "** in server **" +
        message.guild.name +
        "**."
      );
    message.channel.send(kickSuccessfulEmbed);
  }
};
