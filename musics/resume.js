const { updateQueue } = require("./play");
const queue = require("./queue");

module.exports = {
  name: "resume",
  description: "Resume the paused music.",
  category: 8,
  music(message, serverQueue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to resume the music when the bot is playing!");

    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return message.channel.send("There is nothing playing.");

    if (serverQueue.paused) {
      serverQueue.paused = false;
      if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.resume();
      updateQueue(message, serverQueue, queue, null);
      return message.channel.send("The song playback has been resumed.");
    } else {
      return message.channel.send("The song playback is not stopped.");
    }
  }
}