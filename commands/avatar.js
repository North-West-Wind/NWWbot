const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
module.exports = {
  name: "avatar",
  description: "Get the avatar URL of the tagged user(s), or your own avatar.",
  aliases: ["icon", "pfp"],
  execute(message) {
    if (!message.mentions.users.size) {
      const Embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(message.author.username + "'s avatar: ")
        .setImage(message.author.displayAvatarURL)
        .setTimestamp()
        .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
      return message.channel.send(Embed);
    }


      const Embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(message.mentions.users.first().username + "'s avatar: ")
        .setImage(message.mentions.users.first().displayAvatarURL)
        .setTimestamp()
        .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
      return message.channel.send(Embed);
    

    message.channel.send(Embed);
  }
};
