const Discord = require("discord.js");
const R34 = new (require("r34api.js"));
const { capitalize, color, extractHostname } = require("../../function.js");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter. Require NSFW channel.",
  aliases: ["r34"],
  usage: "<tags>",
  category: 5,
  args: 1,
  async execute(message, args) {
    args = args.map(x => capitalize(x));
    async function pick() {
      try {
        const post = await R34.search(args.join(" "));
        if (!post || post.status != 200) throw new Error(post.msg);
        else return post.data;
      } catch (err) {
        await message.reply(`there was an error trying to find rule34 with ${args.length > 1 ? "these tags" : "this tag"}!`);
        return { error: true };
      }
    }
    const post = await pick();
    if(post.error) return;
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Searching tags: " + args.join(", "))
      .setDescription("Tags: `" + post.tags.join(", ") + "`\nPlease be patient. Image will load soon...")
      .setTimestamp()
      .setFooter("From " + extractHostname(post.post), message.client.user.displayAvatarURL())
      .setImage(post.media);

    await message.channel.send(Embed);
  }
}