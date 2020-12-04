const Discord = require("discord.js");
const { readableDateTime } = require("../function.js");

module.exports = {
  name: "ping",
  description: "Ping the bot and it will show you something interesting (not really).",
  category: 6,
  execute(message) {
    const msgDate = new Date(message.createdTimestamp);
    const msgTime = readableDateTime(msgDate)

    const currentDate = new Date();
    const currentTime = readableDateTime(currentDate);

    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
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
