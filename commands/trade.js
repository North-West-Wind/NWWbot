const Discord = require('discord.js');
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "trade",
  description: "Announce in the channel that you want to trade something.",
  args: true,
  usage: " ",
  async execute(message, args) {
    message.delete();
    const filter = x => x.author.id === message.author.id;
    var msg = await message.channel.send("What do you want?");
    var collected = await message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ["time"]}).catch(err => msg.edit("Timed out"));
    var want = collected.first().content;
    if(want === "cancel") {
      collected.first().delete();
      return msg.edit("Cancelled trade.")
    }
    await collected.first().delete();
    await msg.edit("What do you have?");
    var collected2 = await message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ["time"]}).catch(err => msg.edit("Timed out"));
    var offer = collected2.first().content;
    if(offer === "cancel") {
      collected2.first().delete();
      return msg.edit("Cancelled trade.")
    }
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