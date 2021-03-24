const querystring = require("querystring");
const Discord = require("discord.js");
const fetch = require("node-fetch").default;
const { createEmbedScrolling, color } = require("../../function.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
module.exports = {
  name: "urban",
  description: "Search the Urban Dictionary on Discord.",
  usage: "<query>",
  category: 7,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "query", "The thing to lookup.").setRequired(true)
  ]),
  async slash() {
    return InteractionResponse.sendMessage("Looking up in Urban Dictionary...");
  },
  async postSlash(client, interaction, args) {
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    args = args?.map(x => x?.value).filter(x => !!x);
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args);
  },
  async execute(message, args) {
    const query = querystring.stringify({ term: args.join(" ") });
    const { list } = await fetch(`https://api.urbandictionary.com/v0/define?${query}`).then(response => response.json());
    if (!list.length) {
      return message.channel.send(`No results found for **${args.join(" ")}**.`);
    }
    const trim = (str, max) => str.length > max ? `${str.slice(0, max - 3)}...` : str;
    const allEmbeds = [];
    for (var i = 0; i < list.length; i++) {
      var answer = list[i];
      const embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(answer.word)
        .setURL(answer.permalink)
        .addField("Definition", trim(answer.definition, 1024))
        .addField("Example", trim(answer.example, 1024))
        .setTimestamp()
        .setFooter(`👍 ${answer.thumbs_up} | 👎 ${answer.thumbs_down}`, message.client.user.displayAvatarURL());
      allEmbeds.push(embed);
    }
    await createEmbedScrolling(message, allEmbeds);
  }
};