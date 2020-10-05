const serp = require("serp");
const Discord = require("discord.js")
var color = Math.floor(Math.random() * 16777214) + 1;
const googleIt = require("google-it");

module.exports = {
  name: "google",
  description: "Google Search everything with Discord.",
  usage: "<query>",
  args: true,
  category: 4,
  async execute(message, args) {
    if(args.length < 1) {
      return message.channel.send("Please provide a query for searching!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    }
    
    var results = [];
    
    var links = await googleIt({ query: args.join(" ") });
    links.slice(0, 10);
    var num = 0;
    for(var i = 0; i < links.length; i++) {
      try {results.push(`${++num}. **[${links[i].title}](${links[i].link})**`);}
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