var RedditAPI = require("reddit-wrapper-v2");
const Discord = require("discord.js");
const { validImgurURL, color } = require("../../function.js")
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

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
  category: 7,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "subreddit", "The subreddits to find memes from.")
  ]),
  async slash() {
      return InteractionResponse.sendMessage("Finding your memes...");
  },
  async postSlash(client, interaction, args) {
      await InteractionResponse.deleteMessage(client, interaction);
      args = args[0].value.split(/ +/);
      const message = await InteractionResponse.createFakeMessage(client, interaction);
      await this.execute(message, args);
  },
  async execute(message, args) {
    var subreddits;
    var def = ["memes", "dankmemes", "meme"];
    
    if(args[0])
      subreddits = args;
    else
      subreddits = def;
    
    var chosen = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    var response = await redditConn.api.get(`/r/${chosen}/hot`, { limit: 100 }).catch(NorthClient.storage.error);
    if(!response) return await this.execute(message, args);
    if(response[1] === undefined) return await this.execute(message, args);
    if(response[1].data === undefined || response[1].data.children[0] === undefined || response[1].data.children[0].data === undefined || response[1].data.children[0].data.url === undefined) return await this.execute(message, args);
    var data = response[1].data.children[Math.floor(Math.random() * response[1].data.children.length)].data;
    if(!data || data.url === undefined || (!data.url.endsWith(".jpg") && !data.url.endsWith(".png") && !data.url.endsWith(".gif") && !validImgurURL(data.url))) return await this.execute(message, args);
    
      const em = new Discord.MessageEmbed()
        .setTitle(`${data.title.substring(0, 256)}`)
        .setURL(`https://reddit.com${data.permalink}`)
        .setImage(data.url)
        .setColor(color())
        .setFooter(`${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`, message.client.user.displayAvatarURL())
        .setTimestamp();
      message.channel.send(em);
  }
};
