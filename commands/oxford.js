var Dictionary = require("oxford-dictionary");
const Discord = require("discord.js")

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

    var stuff = [];

    for (var i = 0; i < lookup.results[0].lexicalEntries.length; i++) {
      var lexical = lookup.results[0].lexicalEntries[i];

      var category = lexical.lexicalCategory.text;
      var senses = lexical.entries[0].senses;

      var data = {
        category: category,
        senses: []
      }

      for (var s = 0; s < senses.length; s++) {

        var sense = senses[s];

        var definitions = sense.definitions.join(" ");
        var examples = [];

        if (sense.examples)
          sense.examples.forEach(example => {
            examples.push(example.text);
          });

        var obj = {
          definitions: definitions,
          examples: examples
        };
        data.senses.push(obj);
      }

      stuff.push(data);

    }

    var allEmbeds = [];

    for (var i = 0; i < stuff.length; i++) {


      for (var s = 0; s < stuff[i].senses.length; s++) {

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

    var msg = await message.channel.send(allEmbeds[0]);
    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    var s = 0;
    await msg.react("⏮");
    await msg.react("◀");
    await msg.react("▶");
    await msg.react("⏭");
    await msg.react("⏹");
    var collector = await msg.createReactionCollector(filter, {
      idle: 60000,
      errors: ["time"]
    });

    collector.on("collect", function (reaction, user) {
      reaction.users.remove(user.id);
      switch (reaction.emoji.name) {
        case "⏮":
          s = 0;
          msg.edit(allEmbeds[s]);
          break;
        case "◀":
          s -= 1;
          if (s < 0) {
            s = allEmbeds.length - 1;
          }
          msg.edit(allEmbeds[s]);
          break;
        case "▶":
          s += 1;
          if (s > allEmbeds.length - 1) {
            s = 0;
          }
          msg.edit(allEmbeds[s]);
          break;
        case "⏭":
          s = allEmbeds.length - 1;
          msg.edit(allEmbeds[s]);
          break;
        case "⏹":
          collector.emit("end");
          break;
      }
    });
    collector.on("end", function () {
      msg.reactions.removeAll().catch(console.error);
    });

  }
}