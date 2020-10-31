const Discord = require("discord.js")
const googleIt = require("google-it");

module.exports = {
  name: "google",
  description: "Google Search everything with Discord.",
  usage: "<query>",
  args: 1,
  category: 4,
  async execute(message, args) {
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
    .setColor(console.color())
    .setTitle("Search results of " + args.join(" "))
    .setDescription(results.join("\n"))
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    message.channel.send(Embed);
    
  }
}