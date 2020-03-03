const Discord = require('discord.js');
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "trade",
  description: "Make a embed to show your trade.",
  args: true,
  usage: "<string>",
  async execute(message, args) {
    message.delete();
    const filter = x => x.author.id === message.author.id;
    var msg = await message.channel.send("What do you want?");
    var collected = await message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ["time"]}).catch(err => msg.edit("Timed out"));
    var want = collected.first().content;
    await collected.first().delete();
    await msg.edit("What do you have?");
    var collected2 = await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]}).catch(err => msg.edit("Timed out"));
    var offer = collected2.first().content;
    await collected2.first().delete();
    msg.delete();
    const Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(message.author.tag + "'s trade")
    .setDescription("Want: " + want + "\n------------------------\nHave: " + offer)
    .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);
  }
}