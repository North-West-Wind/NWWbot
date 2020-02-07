const { Set } = require("discord-set");
const set = new Set();

module.exports = {
  name: "meme",
  description: "Display a meme from reddit",
  async execute(message, args) {
    set.meme(message.channel, ["memes", "dankmemes", "meme"], { readyMade: true });
  }
}