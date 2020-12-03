const Discord = require("discord.js");
const neko = require("akaneko");
const { ms } = require("../function.js");

module.exports = {
  name: "hentai",
  description: "Return something very NSFW. Require NSFW channel.",
  usage: "[tag | auto] [amount] [interval]",
  aliases: ["h"],
  tags: [
    "ass",
    "bdsm",
    "blowjob",
    "cum",
    "doujin",
    "feet",
    "femdom",
    "foxgirl",
    "gifs",
    "glasses",
    "hentai",
    "netorare",
    "maid",
    "masturbation",
    "orgy",
    "panties",
    "pussy",
    "school",
    "tentacles",
    "thighs",
    "uglyBastard",
    "uniform",
    "yuri",
    "zettaiRyouiki",
    "neko"
  ],
  category: 5,
  async execute(message, args) {
    if (!message.channel.nsfw) return message.channel.send("Please use an NSFW channel to use this command!");
    var tag = "random";
    if (args.length >= 1) {
      if (args[0].toLowerCase() === "tags") return await this.tagsList(message); 
      else if (args[0].toLowerCase() === "auto") return await this.auto(message, args);
      const testTag = args[0];
      const i = this.tags.findIndex(t => testTag === t);
      if (i !== -1) tag = this.tags[i];
    }
    if (tag === "random") return await this.random(message);
    if (tag === "neko") var result = await neko.lewdNeko();
    else var result = await neko.nsfw[tag]();
    const embed = new Discord.MessageEmbed()
      .setTitle("Tag: " + tag)
      .setColor(console.color())
      .setImage(result)
      .setTimestamp()
      .setFooter("Made with Akaneko", message.client.user.displayAvatarURL());
    await message.channel.send(embed);
  },
  async random(message) {
    var index = Math.floor(Math.random() * this.tags.length);
    var tag = this.tags[index];
    if (tag === "neko") var result = await neko.lewdNeko();
    else var result = await neko.nsfw[tag]();
    const embed = new Discord.MessageEmbed()
      .setTitle("Tag: " + tag)
      .setColor(console.color())
      .setImage(result)
      .setTimestamp()
      .setFooter("Made with Akaneko", message.client.user.displayAvatarURL());
    await message.channel.send(embed);
  },
  async tagsList(message) {
    const list = new Discord.MessageEmbed()
      .setTitle("Tag list")
      .setColor(console.color())
      .setDescription("**" + this.tags.join("**\n**") + "**")
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL())
    message.channel.send(list);
  },
  async auto(message, args) {
    if(!args[1]) return message.channel.send("You didn't provide the amount of messages to be sent!");
    else if(!args[2]) return message.channel.send("You didn't provide the interval between each message!");
    var amount = parseInt(args[1]);
    var interval = ms(args[2]);
    if(isNaN(amount)) return message.channel.send("The amount of message is invalid!");
    else if(!interval) return message.channel.send("The interval is not valid!");
    else if(interval < 1000) return message.channel.send("The interval must be larger than 1 second!");
    else if(interval > 300000) return message.channel.send("The interval must be smaller than 5 minutes!");
    else if(amount < 1) return message.channel.send("The amount of message must be larger than 0!");
    else if(amount > 120) return message.channel.send("The amount of message must be smaller than 120!");
    await message.channel.send(`Auto-hentai initialized. **${amount} messages** with interval **${interval} milliseconds**`);
    var counter = 0;
    var i = setInterval(async() => {
      if(counter === amount) {
        await message.channel.send("Auto-hentai ended. Thank you for using that!");
        return clearInterval(i);
      }
      await this.random(message);
      counter++;
      console.log(`Auto-hentai ${counter} times in channel ${message.channel.name} of server ${message.guild.name}`);
    }, interval);
  }
};
