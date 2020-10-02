var RedditAPI = require("reddit-wrapper-v2");
const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { validImgurURL } = require("../function.js")

var redditConn = new RedditAPI({
  // Options for Reddit Wrapper
  username: process.env.RUSER,
  password: process.env.RPW,
  app_id: process.env.APPID,
  api_secret: process.env.APPSECRET,
  user_agent: "Reddit-Watcher-V2",
  retry_on_wait: true,
  retry_on_server_error: 5,
  retry_delay: 1
});

module.exports = {
  name: "reddit",
  description: "Fetch memes from Reddit.",
  usage: "[subreddits]",
  aliases: ["meme"],
  async execute(message, args) {
    var subreddits;
    var def = ["memes", "dankmemes", "meme"];
    
    if(args[0])
      subreddits = args;
    else
      subreddits = def;
    
    var chosen = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    var response = await redditConn.api.get(`/r/${chosen}/hot`, { limit: 100 }).catch(console.error);
    if(!response) return await this.execute(message, args);
    if(response[1] === undefined) return await this.execute(message, args);
    if(response[1].data === undefined || response[1].data.children[0] === undefined || response[1].data.children[0].data === undefined || response[1].data.children[0].data.url === undefined) return await this.execute(message, args);
    var data = response[1].data.children[Math.floor(Math.random() * response[1].data.children.length)].data;
    if(!data || data.url === undefined || (!data.url.endsWith(".jpg") && !data.url.endsWith(".png") && !data.url.endsWith(".gif") && !validImgurURL(data.url))) return await this.execute(message, args);
    
      const em = new Discord.MessageEmbed()
        .setTitle(`${data.title.substring(0, 256)}`)
        .setURL(`https://reddit.com${data.permalink}`)
        .setImage(data.url)
        .setColor(color)
        .setFooter(
          `${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`
        )
        .setTimestamp();
      message.channel.send(em);
  }
};
