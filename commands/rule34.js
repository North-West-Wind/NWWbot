const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const Booru = require("booru");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter.",
  aliases: ["r34"],
  usage: "[tags]",
  async execute(message, args) {
    if(message.channel.nsfw === false) {
      return message.channel.send("Please use an NSFW channel to use this command!")
    }
    if(!args[0]) return message.channel.send("Please provide at least 1 tag!")
    async function pick() {
    var sites = Object.values(require("../sites.json")).filter(x => x.nsfw === true);
    var pickedSite = sites[Math.floor(Math.random() * sites.length)];
    
    var posts = await Booru.search(pickedSite.domain, args, { limit: 100, random: false });
    var pickedPost = posts[Math.floor(Math.random() * posts.length)];
      if(pickedPost === undefined) return pick();
      else return pickedPost;
    }
    
    var post = await pick();
    const Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle("Tags: " + args.join(", "))
    .setImage(post.fileUrl)
    .setTimestamp()
    .setFooter("From " + post.booru.domain, message.client.user.displayAvatarURL());
    
    message.channel.send(Embed);
  }
}