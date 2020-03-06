const { Set } = require("discord-set");
const set = new Set();

module.exports = {
  name: "meme",
  description: "Display a meme from reddit",
  usage: "[subreddit]",
  async execute(message, args) {
    if(!args[0])
    return set.meme(message.channel, ["memes", "dankmemes", "meme"], { readyMade: true });
    
    try {
    set.meme(message.channel, args, { readyMade: true });
    } catch(err) {
      return message.channel.send("That is not a valid subreddit!");
    }
  }
}