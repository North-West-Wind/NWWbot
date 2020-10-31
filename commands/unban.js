const Discord = require("discord.js");
const { findUser } = require("../function.js");

module.exports = {
  name: "unban",
  description: "Unban a member of the server.",
  usage: "<user | user ID> [reason]",
  args: 1,
  category: 1,
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(4)) return message.channel.send(`You don\'t have the permission to use this command.`);
    if (!message.guild.me.permissions.has(4)) return message.channel.send(`I don\'t have the permission to unban members.`);
    const user = await findUser(message, args[0])
    if (!user) return;
    if (args[1]) {
      var reason = args.slice(1).join(" ");
      await message.guild.members.unban(user, reason);
    } else {
      await message.guild.members.unban(user);
    }
    var unbanEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(`You've been unbanned`)
      .setDescription(`In **${message.guild.name}**`)
      .setTimestamp()
      .setFooter(
        "Unbanned by " + message.author.tag,
        message.author.displayAvatarURL()
      );
    if (args[1]) {
      unbanEmbed.addField("Reason", reason);
    }
    user.send(unbanEmbed).catch(() => {
      console.log("Failed to send DM to " + user.username);
    });
    var unbanSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("User Unbanned!")
      .setDescription(
        "Unbanned **" +
        user.username +
        "** in server **" +
        message.guild.name +
        "**."
      );
    message.channel.send(unbanSuccessfulEmbed);
  }
};
