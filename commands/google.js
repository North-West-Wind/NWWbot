const serp = require("serp");
const Discord = require("discord.js")
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "google",
  description: "Google Search everything with Discord.",
  usage: "<query>",
  args: true,
  async execute(message, args) {
    
    if(args.length < 1) {
      return message.channel.send("Please provide a query for searching!");
    }
    
    var options = {
      qs: {
        q: args.join(" ")
      },
      num: 10
    }
    var results = [];
    
    var links = await serp.search(options)

    var num = 0;
    for(var i = 0; i < links.length; i++) {
      try {results.push(`${++num}. **[${links[i].title}](${links[i].url})**`);}
      catch(err) {
        --num
      }
    }
    const Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle("Search results of " + args.join(" "))
    .setDescription(results.join("\n"))
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    message.channel.send(Embed);
    
  }
}