const Discord = require("discord.js");
const { findMember } = require("../function.js");
module.exports = {
  name: "ban",
  description: "Ban a member from the server.",
  args: 1,
  usage: "<user | user ID> [days] [reason]",
  category: 1,
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(4)) return message.channel.send(`You don\'t have the permission to use this command.`);
    if (!message.guild.me.permissions.has(4)) return message.channel.send(`I don\'t have the permission to ban members.`);
    const member = await findMember(message, args[0])

    if (!member) return;
    let reason = "";
    var options = {};
    if (args[1]) {
      if(isNaN(parseInt(args[1])) || parseInt(args[1]) > 7 || parseInt(args[1]) < 0) return message.channel.send("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
      if(args[2]) reason = args.slice(2).join(" ");
      options = { reason: reason, days: parseInt(args[1]) };
    }
    await member.ban(options);
    var banEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(`You've been banned`)
      .setDescription(`In **${message.guild.name}**`)
      .setTimestamp()
      .setFooter(
        "Banned by " + message.author.tag,
        message.author.displayAvatarURL()
      );
    if (reason !== "") {
      banEmbed.addField("Reason", reason);
    }
    user.send(banEmbed).catch(() => {
      console.log("Failed to send DM to " + user.username)
    });
    var banSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("User Banned!")
      .setDescription(
        "Banned **" +
        user.tag +
        "** in server **" +
        message.guild.name +
        "**."
      );
    message.channel.send(banSuccessfulEmbed);
  }
};
