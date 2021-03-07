const Discord = require("discord.js");
const { readableDateTime, readableDateTimeText, color } = require("../function.js");
const { version } = require("../package.json");

module.exports = {
  name: "info",
  description: "Display information of the bot.",
  category: 6,
  async execute(message) {
    var lastReady = readableDateTime(message.client.readyAt);
    const infoEmbed = new Discord.MessageEmbed()
      .setTitle(message.client.user.tag)
      .setColor(color())
      .setThumbnail(message.client.user.displayAvatarURL())
      .setDescription(`Made by NorthWestWind!\nVersion: **[${version}](https://northwestwind.ml/news)**\n\nRunning on **${message.client.guilds.cache.size} servers**\nLast restart: **${lastReady}**\nUptime: **${readableDateTimeText(message.client.uptime)}**`)
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    await message.channel.send(infoEmbed);
  }
}