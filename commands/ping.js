const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse, InteractionApplicationCommandCallbackData, InteractionResponseType } = require("../classes/Slash.js");
const { readableDateTime, color } = require("../function.js");

module.exports = {
  name: "ping",
  description: "Ping the bot and it will show you something interesting (not really).",
  category: 6,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description),
  slash: async(client) => {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Pong!")
      .setDescription("Sorry. Ping isn't working for Slash Commands :/")
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return new InteractionResponse(InteractionResponseType.ChannelMessageWithSource.valueOf()).setData(new InteractionApplicationCommandCallbackData().setEmbeds([Embed.toJSON()]));
  },
  async execute(message) {
    const msgDate = new Date(message.createdTimestamp);
    const msgTime = readableDateTime(msgDate)

    const currentDate = new Date();
    const currentTime = readableDateTime(currentDate);

    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Ping")
      .addField("Message sent", "`" + msgTime + "`")
      .addField("Message received", "`" + currentTime + "`")
      .addField("Ping", "`" + (currentDate - msgDate) + "ms`")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    await message.channel.send(Embed);
    await message.author.send("Pong! Don't question me. I'm online.")
  }
};
