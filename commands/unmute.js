const Discord = require("discord.js");
const { findMember } = require("../function.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "unmute",
  description: "Unmute a member while the member is in a voice channel.",
  args: true,
  usage: "<user | user ID> [reason]",
  category: 1,
  async execute(message, args) {
    if (!message.member.permissions.has(4194304)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has(4194304)) {
      message.channel.send(`I don\'t have the permission to unmute members.`)
      return;
    }
    if (!message.guild) return;

    if (!args[0]) {
      return message.channel.send("You didn't mention any user!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``)
    }


    var member = await findMember(message, args[0]);


    if (!member) return;
    if (!member.voice.channel) return message.channel.send("The member is not connected to any voice channel.")
    message.delete()
    try {
      if (args[1]) {
        var reason = args.slice(1).join(" ");
      }
      if (reason) {
        member.voice.setMute(false, reason)
      } else {
        member.voice.setMute(false);
      }

      var muteEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`You've been unmuted`)
        .setDescription(`In **${message.guild.name}**`)
        .setTimestamp()
        .setFooter(
          "Unmuted by " + message.author.tag,
          message.author.displayAvatarURL()
        );
      if (reason) muteEmbed.addField("Reason", reason);
      var muteSuccessfulEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("User Successfully Unmuted!")
        .setDescription(
          "Unmuted **" +
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
        .setColor(color)
        .setTitle("Failed to Unmute User!")
        .setDescription(
          "Couldn't unmute **" +
          member.user.tag +
          "** in server **" +
          message.guild.name +
          "**."
        );
      message.author.send(muteFailureEmbed);
    }
  }
}