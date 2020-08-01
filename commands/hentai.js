const Discord = require("discord.js");
const neko = require("akaneko");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "hentai",
  description:
    "Return something very NSFW. Require NSFW channel.",
  usage: "[tag]",
  aliases: ["h"],
  tags: [
    "ass",
    "bdsm",
    "cum",
    "femdom",
    "doujin",
    "hentai",
    "maid",
    "orgy",
    "panties",
    "neko"
  ],
  async execute(message, args) {
    if(message.channel.nsfw === false) {
      return message.channel.send("Please use an NSFW channel to use this command!")
    }
    var tag = "random";
    if (args.length >= 1) {
      if (args[0] === "tags") {
      return await this.tagsList(message);
    }
      const testTag = args[0];
      const i = this.tags.findIndex(t => testTag === t);

      if (i !== -1) {
        tag = this.tags[i];
      }
    }
    if (tag === "random") {
      return await this.random(message);
    }
    
    if(tag === "neko") {
      var result = neko.lewdNeko();
    } else {
      var result = neko.nsfw[tag]();
    }
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Tag: " + tag)
    .setColor(color)
    .setImage(result)
    .setTimestamp()
    .setFooter("Made with Akaneko", message.client.user.displayAvatarURL());
    message.channel.send(embed);
    
    
  },
  async random(message) {
    var index = Math.floor(Math.random() * this.tags.length);
    var tag = this.tags[index];
    if(tag === "neko") {
      var result = neko.lewdNeko();
    } else {
      var result = neko.nsfw[tag]();
    }
    const embed = new Discord.MessageEmbed()
    .setTitle("Tag: " + tag)
      .setColor(color)
      .setImage(result)
    .setTimestamp()
      .setFooter("Made with Akaneko", message.client.user.displayAvatarURL());
    message.channel.send(embed);
  },
  async tagsList(message) {
    const list = new Discord.MessageEmbed()
    .setTitle("Tag list")
    .setColor(color)
    .setDescription("**" + this.tags.join("**\n**") + "**")
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL())
    message.channel.send(list);
  }
};
