var Dictionary = require("oxford-dictionary");
const Discord = require("discord.js")
const { createEmbedScrolling } = require("../function.js");
var config = {
  app_id: process.env.OXID,
  app_key: process.env.OXSECRET,
  source_lang: "en-us"
};

var dict = new Dictionary(config);

module.exports = {
  name: "oxford",
  description: "Search definitions of words from Oxford Dictionary. If it cannot search, use \"urban\" instead.",
  usage: "<keywords>",
  aliases: ["ox"],
  category: 7,
  args: 1,
  async execute(message, args) {
    try {
      var lookup = await dict.find(escape(args.join(" ")));
    } catch (err) {
      console.error(err);
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
          .setColor(console.color())
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