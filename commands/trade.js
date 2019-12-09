const Discord = require('discord.js');

module.exports = {
  name: "trade",
  description: "Make a embed to show your trade.",
  args: true,
  usage: "<string>",
  execute(message, args) {
    message.delete(0);
    const Embed = new Discord.RichEmbed()
    .setTitle(message.author.username + "'s trade")
    .setDescription(args.slice(0).join(" "))
    .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);
  }
}