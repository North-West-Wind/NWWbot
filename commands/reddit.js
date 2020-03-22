var RedditAPI = require("reddit-wrapper-v2");
const Discord = require("discord.js");

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
  execute(message, args) {
    var subreddits;
    var def = ["memes", "dankmemes", "meme"];
    
    if(args[0])
      subreddits = args;
    else
      subreddits = def;
    
    var chosen = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    redditConn.api
      .get("/r/" + chosen + "/random")
      .then(function(response) {
        var data = response[1][0].data.children[0].data;
        const em = new Discord.MessageEmbed()
          .setTitle(`${data.title.substring(0, 256)}`)
          .setURL(`https://reddit.com${data.permalink}`)
          .setImage(data.url)
          .setColor("BLURPLE")
          .setFooter(
            `${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`
          )
          .setTimestamp();

        message.channel.send(em);
      })
      .catch(function(err) {
      message.reply("there was an error trying to execute that command!")
        return console.error("api request failed: " + err);
      });
  }
};
