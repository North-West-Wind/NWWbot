const Discord = require("discord.js");
const { capitalize, color, xmlToJson } = require("../../function.js");
const fetch = require("node-fetch").default;
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "rule34",
  description: "Display Rule34 images. Add tags to filter. Require NSFW channel.",
  aliases: ["r34"],
  usage: "<tags>",
  category: 5,
  args: 1,
  slashInit: true,
  register() {
    return ApplicationCommand.createBasic(module.exports).setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "tags", "The tags of rule34 to search for.").setRequired(true)
    ])
  },
  async slash(client, interaction) {
    if (interaction.channel_id && !(await client.channels.fetch(interaction.channel_id)).nsfw) return InteractionResponse.sendMessage("Please use an NSFW channel to use this command!");
    return InteractionResponse.sendMessage("Looking for Rule34...");
  },
  async postSlash(client, interaction, args) {
    if (interaction.channel_id && !(await client.channels.fetch(interaction.channel_id)).nsfw) return;
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    args = args?.map(x => x?.value).filter(x => !!x) || [];
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args);
  },
  async execute(message, args) {
    args = args.map(x => x.split("_").map(y => encodeURIComponent(capitalize(y))).join("_"));
    async function pick() {
      try {
        const post = await fetch(`http://rule34.paheal.net/api/danbooru/find_posts/index.xml?tags=${args.join("+")}&limit=100`);
        if (!post || post.status != 200) throw new Error(post.msg);
        else {
          const json = (await post.text().then(str => xmlToJson(str)));
          return json.posts.tag[Math.floor(Math.random() * json.posts.tag.length)].$;
        }
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
      .setDescription("Tags: `" + post.tags.split(/ +/).join("`, `") + "`\nPlease be patient. Image will load soon...")
      .setTimestamp()
      .setFooter("From rule34.paheal.net", message.client.user.displayAvatarURL())
      .setImage(post.file_url);

    await message.channel.send(Embed);
  }
}