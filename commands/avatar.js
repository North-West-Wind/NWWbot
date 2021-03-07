const Discord = require("discord.js");
const { findUser, color } = require("../function.js");
module.exports = {
  name: "avatar",
  description: "Display the message author's avatar or the mentioned user's avatar.",
  aliases: ["icon", "pfp"],
  usage: "[user | user ID]",
  category: 6,
  async execute(message, args) {
    if (!args[0]) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(message.author.username + "'s avatar: ")
        .setImage(message.author.displayAvatarURL({ size: 4096 }))
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      return await message.channel.send(Embed);
    }
    const user = await findUser(message, args[0]);
    if (!user) return;
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(user.username + "'s avatar: ")
      .setImage(user.displayAvatarURL({ size: 4096 }))
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    return message.channel.send(Embed);
  }
};
