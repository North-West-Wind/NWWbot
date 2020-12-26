const { shuffleArray } = require("../function.js");
const { updateQueue } = require("./main.js");
module.exports = {
  name: "shuffle",
  description: "Shuffle the queue.",
  category: 8,
  async music(message, serverQueue) {
    if (!serverQueue || serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to shuffle the queue when the bot is playing!");
    if(serverQueue.playing) await shuffleArray(serverQueue.songs, 1);
    else await shuffleArray(serverQueue.songs, 0);
    updateQueue(message, serverQueue, message.pool);
    message.channel.send("Song queue has been shuffled.");
  }
};
