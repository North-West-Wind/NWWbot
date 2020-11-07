const Discord = require("discord.js");
const { findMember } = require("../function.js");

module.exports = {
  name: "undeafen",
  description: "Undeafen a member while the member is in a voice channel.",
  args: 1,
  aliases: ["undeaf"],
  usage: "<user | user ID> [reason]",
  category: 1,
  async execute(message, args) {
    if (!message.member.permissions.has(8388608)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has(8388608)) {
      message.channel.send(`I don\'t have the permission to undeafen members.`)
      return;
    }
    if (!message.guild) return;
    const member = await findMember(message, args[0]);

    if (!member) return;
    if (!member.voice.channel) return message.channel.send("The member is not connected to any voice channel.")
    message.delete()
    try {
      if (args[1]) {
        var reason = args.slice(1).join(" ");
      }
      if (reason) {
        member.voice.setDeaf(false, reason)
      } else {
        member.voice.setDeaf(false);
      }
      var muteEmbed = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle(`You've been undeafened`)
        .setDescription(`In **${message.guild.name}**`)
        .setTimestamp()
        .setFooter(
          "Undeafened by " + message.author.tag,
          message.author.displayAvatarURL()
        );
      if (reason) muteEmbed.addField("Reason", reason);
      var muteSuccessfulEmbed = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle("User Successfully Undeafened!")
        .setDescription(
          "Undeafened **" +
          member.user.tag +
          "** in server **" +
          message.guild.name +
          "**."
        );
      try {
        member.user.send(muteEmbed);
      } catch (error) {
        console.log("Failed to send DM to " + member.user.username);
      }

      message.author.send(muteSuccessfulEmbed)

    } catch (error) {
      var muteFailureEmbed = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle("Failed to Undeafen User!")
        .setDescription(
          "Couldn't undeafen **" +
          member.user.tag +
          "** in server **" +
          message.guild.name +
          "**."
        );
      message.author.send(muteFailureEmbed);
    }
  }
}