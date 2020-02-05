const Discord = require("discord.js");
const neko = require("nekos.life");
const { nsfw } = new neko();
var color = Math.floor(Math.random() * 16777214) + 1;
const { prefix } = require("../config.json");

module.exports = {
  name: "hentai",
  description:
    "Display a hentai image. Use `" +
    prefix +
    "hentai tags` to display tags. Empty tag for random gif.",
  usage: "[tag]",
  aliases: ["h"],
  tags: [
    "pussy",
    "nekoGif",
    "neko",
    "lesbian",
    "kuni",
    "cumsluts",
    "classic",
    "boobs",
    "bJ",
    "anal",
    "avatar",
    "yuri",
    "trap",
    "tits",
    "girlSoloGif",
    "girlSolo",
    "smallBoobs",
    "pussyWankGif",
    "pussyArt",
    "kemonomimi",
    "kitsune",
    "keta",
    "holo",
    "holoEro",
    "hentai",
    "futanari",
    "femdom",
    "feetGif",
    "eroFeet",
    "feet",
    "ero",
    "eroKitsune",
    "eroKemonomimi",
    "eroNeko",
    "eroYuri",
    "cumArts",
    "blowJob",
    "pussyGif"
  ],
  async execute(message, args) {
    
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
    
    var result = await nsfw[tag]();
    
    const embed = new Discord.RichEmbed()
    .setColor(color)
    .setImage(result.url)
    .setFooter("Made with Neko's Life", message.client.user.displayAvatarURL);
    message.channel.send(embed);
    
    
  },
  async random(message) {
    var result = await nsfw.randomHentaiGif();
    const embed = new Discord.RichEmbed()
      .setColor(color)
      .setImage(result.url)
      .setFooter("Made with Neko's Life", message.client.user.displayAvatarURL);
    message.channel.send(embed);
  },
  async tagsList(message) {
    const embed = new Discord.RichEmbed()
      .setTitle("Hentai tag list")
      .setColor(color)
      .setDescription("**" + this.tags.join("\n") + "**")
      .setFooter(
        "Do not question when tags repeated.",
        message.client.user.displayAvatarURL
      );
    message.channel.send(embed);
  }
};
