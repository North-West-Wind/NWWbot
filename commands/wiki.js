const wiki = require('wikijs').default;
const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "wiki",
  description: "Search Wikipedia for stuff.",
  usage: "<query>",
  aliases: ["wikipedia"],
  async execute(message, args) {
    if(!args[0]) return message.channel.send("Please provide keywords to search with!");
    var data = await wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' }).search(args.join(" "), 100);
    var num = 0;
    var allEmbeds = [];
    for(const result of data.results) {
      try {
        var page = await wiki({ headers: { 'User-Agent': 'N0rthWestW1nd/2.0.0 (https://www.nwws.ml; no_u@nwws.ml) wiki.js' }, apiUrl: 'https://en.wikipedia.org/w/api.php' }).page(result);
        var url = await page.url();
        var summary = await page.summary();
        var title = result;
      
        const em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`${++num}. ${title}`)
        .setDescription(summary.length > 2048 ? (summary.slice(0, 2045) + "...") : summary)
        .setTimestamp()
        .setURL(url)
        .setFooter("1️⃣, 2️⃣ and 3️⃣ are for navigating to 25th, 50th, 75th result.");
        allEmbeds.push(em);
      } catch(err) {
        console.error(err);
        --num;
      }
    }
    
    var emojis = ["⏮", "◀", "▶", "⏭", "⏹"];
    if(allEmbeds[24]) emojis.push("1️⃣");
    if(allEmbeds[49]) emojis.push("2️⃣");
    if(allEmbeds[74]) emojis.push("3️⃣")
    
    var msg = await message.channel.send(allEmbeds[0]);
    const filter = (reaction, user) => {
      return (
        emojis.includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    var s = 0;
    for(const emoji of emojis) {
      msg.react(emoji);
    }
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
        case "1️⃣":
          s = 24;
          msg.edit(allEmbeds[s]);
          break;
        case "2️⃣":
          s = 49;
          msg.edit(allEmbeds[s]);
          break;
        case "3️⃣":
          s = 74;
          msg.edit(allEmbeds[s]);
          break;
      }
    });
    collector.on("end", function() {
      msg.reactions.removeAll().catch(console.error);
    });
  }
}