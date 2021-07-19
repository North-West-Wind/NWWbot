const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse, InteractionResponseType, InteractionApplicationCommandCallbackData } = require("../../classes/Slash.js");
const { readableDateTime, readableDateTimeText, color } = require("../../function.js");
const { version } = require("../../package.json");

module.exports = {
  name: "info",
  description: "Display information of the bot.",
  category: 6,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description),
  async slash(client) {
    var lastReady = readableDateTime(client.readyAt);
    const infoEmbed = new Discord.MessageEmbed()
      .setTitle(client.user.tag)
      .setColor(color())
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Made by NorthWestWind!\nVersion: **[${version}](https://northwestwind.ml/news)**\n\nRunning on **${client.guilds.cache.size} servers**\nLast restart: **${lastReady}**\nUptime: **${readableDateTimeText(client.uptime)}**`)
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());

    return new InteractionResponse(InteractionResponseType.ChannelMessageWithSource.valueOf()).setData(new InteractionApplicationCommandCallbackData().setEmbeds([infoEmbed.toJSON()]));
  },
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