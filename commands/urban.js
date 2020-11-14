const querystring = require("querystring");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const { createEmbedScrolling } = require("../function.js");
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
    const trim = (str, max) => str.length > max ? `${str.slice(0, max - 3)}...` : str;
    const allEmbeds = [];
    for (var i = 0; i < list.length; i++) {
      var answer = list[i];
      const embed = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle(answer.word)
        .setURL(answer.permalink)
        .addField("Definition", trim(answer.definition, 1024))
        .addField("Example", trim(answer.example, 1024))
        .setTimestamp()
        .setFooter(`👍 ${answer.thumbs_up} | 👎 ${answer.thumbs_down}`, message.client.user.displayAvatarURL());
      allEmbeds.push(embed);
    }
    message.channel.stopTyping(true);
    await createEmbedScrolling(message, allEmbeds);
  }
};
