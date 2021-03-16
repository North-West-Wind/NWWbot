const Discord = require("discord.js")
const googleIt = require("google-it");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash");
const { color } = require("../function");

module.exports = {
  name: "google",
  description: "Google Search everything with Discord.",
  usage: "<query>",
  args: 1,
  category: 4,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "query", "The keywords to search for.").setRequired(true)
  ]),
  slash: async() => {
    const results = [];
    var links = await googleIt({ query: args.join(" ") });
    links = links.slice(0, 10);
    var num = 0;
    for(var i = 0; i < links.length; i++) {
      try {results.push(`${++num}. **[${links[i].title}](${links[i].link})**`);}
      catch(err) {
        --num
      }
    }
    const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("Search results of " + args.join(" "))
    .setDescription(results.join("\n"))
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    return InteractionResponse.sendEmbeds(Embed);
  },
  async execute(message, args) {
    var results = [];
    var links = await googleIt({ query: args.join(" ") });
    links = links.slice(0, 10);
    var num = 0;
    for(var i = 0; i < links.length; i++) {
      try {results.push(`${++num}. **[${links[i].title}](${links[i].link})**`);}
      catch(err) {
        --num
      }
    }
    const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("Search results of " + args.join(" "))
    .setDescription(results.join("\n"))
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    await message.channel.send(Embed);
  }
}