const querystring = require("querystring");
const Discord = require("discord.js");
const fetch = require("node-fetch");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "urban",
  description: "Search the Urban Dictionary on Discord.",
  args: true,
  usage: "<query>",
  category: 7,
  async execute(message, args) {
    if (!args.length) {
      return message.channel.send("You need to supply a search term!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    }

    const query = querystring.stringify({ term: args.join(" ") });

    const { list } = await fetch(
      `https://api.urbandictionary.com/v0/define?${query}`
    ).then(response => response.json());
    if (!list.length) {
      return message.channel.send(
        `No results found for **${args.join(" ")}**.`
      );
    }
    const trim = (str, max) =>
      str.length > max ? `${str.slice(0, max - 3)}...` : str;
    var allEmbeds = [];
    for (var i = 0; i < list.length; i++) {
      var answer = list[i];
      const embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(answer.word)
        .setURL(answer.permalink)
        .addField("Definition", trim(answer.definition, 1024))
        .addField("Example", trim(answer.example, 1024))
        .setTimestamp()
        .setFooter(
          `👍 ${answer.thumbs_up} | 👎 ${answer.thumbs_down}`,
          message.client.user.displayAvatarURL()
        );
      allEmbeds.push(embed);
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

    collector.on("collect", function(reaction, user) {
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
    collector.on("end", function() {
      msg.reactions.removeAll().catch(console.error);
    });
  }
};
