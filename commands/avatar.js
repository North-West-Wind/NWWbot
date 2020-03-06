const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");
module.exports = {
  name: "avatar",
  description: "Display the message author's avatar or the mentioned user's avatar.",
  aliases: ["icon", "pfp"],
  usage: "[user | user ID]",
  async execute(message, args) {
    if (!args[0]) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(message.author.username + "'s avatar: ")
        .setImage(message.author.displayAvatarURL())
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      return message.channel.send(Embed);
    }

    var user = await findUser(message, args[0]);
    if(!user) return;

      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(user.username + "'s avatar: ")
        .setImage(user.displayAvatarURL())
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      return message.channel.send(Embed);
    

    message.channel.send(Embed);
  }
};
