const Discord = require("discord.js");
const Booru = require("booru");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter. Require NSFW channel.",
  aliases: ["r34"],
  usage: "<tags>",
  category: 5,
  args: 1,
  async execute(message, args) {
    if (!message.channel.nsfw) {
      return message.channel.send("Please use an NSFW channel to use this command!")
    }
    async function pick() {
      try {
        var posts = await Booru.search("rule34.paheal.net", args, { random: true });
      } catch (err) {
        await message.reply("there was an error trying to find rule34 with this tag!");
        return { error: true };
      }
      var pickedPost = posts[Math.floor(Math.random() * posts.length)];
      if (!pickedPost) return await pick();
      else return pickedPost;
    }
    var post = await pick();
    if(post.error) return;
    var fileUrl;
    if (post.sampleUrl) fileUrl = post.sampleUrl;
    else if (post.fileUrl) fileUrl = post.fileUrl;
    else if (post.source) fileUrl = post.source;
    else if (post.data.file_url) fileUrl = post.data.file_url;
    else return message.channel.send("Cannot find any image!");
    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Searching tags: " + args.join(", "))
      .setDescription("Tags: `" + post.tags.join(", ") + "`\nPlease be patient. Image will load soon...")
      .setTimestamp()
      .setFooter("From " + post.booru.domain, message.client.user.displayAvatarURL())
      .setImage(fileUrl);

    message.channel.send(Embed);
  }
}