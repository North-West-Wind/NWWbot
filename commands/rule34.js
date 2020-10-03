const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const Booru = require("booru");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter. Require NSFW channel.",
  aliases: ["r34"],
  usage: "<tags>",
  category: 5,
  async execute(message, args) {
    if(!message.channel.nsfw) {
      return message.channel.send("Please use an NSFW channel to use this command!")
    }
    if(!args[0]) return message.channel.send("Please provide at least 1 tag!" + ` Usage: ${message.client.prefix}${this.name} ${this.usage}`)
    async function pick() {
    var posts = await Booru.search("rule34.paheal.net", args, { limit: 100, random: false });
    var pickedPost = posts[Math.floor(Math.random() * posts.length)];
      if(!pickedPost) return pick();
      else return pickedPost;
    }
    
    var post = await pick();
    var fileUrl;
    if(post.sampleUrl) fileUrl = post.sampleUrl;
    else if(post.fileUrl) fileUrl = post.fileUrl;
    else if(post.source) fileUrl = post.source;
    else if(post.data.file_url) fileUrl = post.data.file_url;
    else return await this.execute(message, args);
    const Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle("Searching tags: " + args.join(", "))
    .setDescription("Tags: `" + post.tags.join(", ") + "`\nPlease be patient. Image will load soon...")
    .setTimestamp()
    .setFooter("From " + post.booru.domain, message.client.user.displayAvatarURL())
    .setImage(fileUrl);
    
    message.channel.send(Embed);
  }
}