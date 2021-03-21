var Dictionary = require("oxford-dictionary");
const Discord = require("discord.js")
const { createEmbedScrolling, color } = require("../../function.js");
var config = {
  app_id: process.env.OXID,
  app_key: process.env.OXSECRET,
  source_lang: "en-us"
};
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

var dict = new Dictionary(config);

module.exports = {
  name: "oxford",
  description: "Search definitions of words from Oxford Dictionary. If it cannot search, use \"urban\" instead.",
  usage: "<keywords>",
  aliases: ["ox"],
  category: 7,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The word to search for.").setRequired(true)
  ]),
  async slash() {
      return InteractionResponse.ackknowledge();
  },
  async postSlash(client, interaction, args) {
      args = args?.map(x => x?.value).filter(x => !!x);
      const message = await InteractionResponse.createFakeMessage(client, interaction);
      await this.execute(message, args);
  },
  async execute(message, args) {
    try {
      var lookup = await dict.find(escape(args.join(" ")));
    } catch (err) {
      NorthClient.storage.error(err);
      return message.channel.send(`No entry was found for **${args.join(" ")}**.`)
    }

    const stuff = [];
    for (let i = 0; i < lookup.results[0].lexicalEntries.length; i++) {
      const lexical = lookup.results[0].lexicalEntries[i];
      const category = lexical.lexicalCategory.text;
      const senses = lexical.entries[0].senses;
      const data = {
        category: category,
        senses: []
      };
      for (let s = 0; s < senses.length; s++) {
        const sense = senses[s];
        const definitions = sense.definitions.join(" ");
        const examples = [];
        if (sense.examples) sense.examples.forEach(example => examples.push(example.text));
        const obj = {
          definitions: definitions,
          examples: examples
        };
        data.senses.push(obj);
      }
      stuff.push(data);
    }
    const allEmbeds = [];
    for (let i = 0; i < stuff.length; i++) {
      for (let s = 0; s < stuff[i].senses.length; s++) {
        var definitions = stuff[i].senses[s].definitions;
        var examples = stuff[i].senses[s].examples.join("\n");
        const Embed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Definitions of \"" + args.join(" ") + "\"")
          .setDescription(`**${stuff[i].category}**`)
          .addField("Definitions", definitions)
          .addField("Examples", examples.length > 0 ? examples : "None")
          .setTimestamp()
          .setFooter("Powered by Oxford Dictionary", message.client.user.displayAvatarURL());
        allEmbeds.push(Embed);
      }
    }
    await createEmbedScrolling(message, allEmbeds);
  }
}