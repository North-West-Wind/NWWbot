const Discord = require("discord.js");
const Booru = require("booru");
const { capitalize } = require("../function.js");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter. Require NSFW channel.",
  aliases: ["r34"],
  usage: "<tags>",
  category: 5,
  args: 1,
  async execute(message, args) {
    if (!message.channel.nsfw) return await message.channel.send("Please use an NSFW channel to use this command!");
    args = args.map(x => capitalize(x));
    async function pick() {
      try {
        const posts = await Booru.search("rule34.paheal.net", args, { random: true });
        if (!posts[0]) return await pick();
        else return posts[0];
      } catch (err) {
        await message.reply(`there was an error trying to find rule34 with ${args.length > 1 ? "these tags" : "this tag"}!`);
        return { error: true };
      }
    }
    const post = await pick();
    if(post.error) return;
    var fileUrl;
    if (post.fileUrl) fileUrl = post.fileUrl;
    else if (post.sampleUrl) fileUrl = post.sampleUrl;
    else if (post.source) fileUrl = post.source;
    else if (post.data.file_url) fileUrl = post.data.file_url;
    else if (post.previewUrl) fileUrl = post.previewUrl;
    else return await message.channel.send("Cannot find any image!");
    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Searching tags: " + args.join(", "))
      .setDescription("Tags: `" + post.tags.join(", ") + "`\nPlease be patient. Image will load soon...")
      .setTimestamp()
      .setFooter("From " + post.booru.domain, message.client.user.displayAvatarURL())
      .setImage(fileUrl);

    await message.channel.send(Embed);
  }
}