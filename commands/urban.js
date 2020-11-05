const querystring = require("querystring");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  name: "urban",
  description: "Search the Urban Dictionary on Discord.",
  usage: "<query>",
  category: 7,
  args: 1,
  async execute(message, args) {
    const query = querystring.stringify({ term: args.join(" ") });
    message.channel.startTyping();
    const { list } = await fetch(`https://api.urbandictionary.com/v0/define?${query}`).then(response => response.json());
    if (!list.length) {
      message.channel.stopTyping(true);
      return message.channel.send(`No results found for **${args.join(" ")}**.`);
    }
    const trim = (str, max) =>
      str.length > max ? `${str.slice(0, max - 3)}...` : str;
    var allEmbeds = [];
    for (var i = 0; i < list.length; i++) {
      var answer = list[i];
      const embed = new Discord.MessageEmbed()
        .setColor(console.color())
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
    message.channel.stopTyping(true);
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
