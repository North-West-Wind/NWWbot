const { updateQueue } = require("./main.js");

module.exports = {
  name: "pause",
  description: "Pause the current music.",
  category: 8,
  music(message, serverQueue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to pause the music when the bot is playing!");
    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return message.channel.send("There is nothing playing.");
    if (!serverQueue.paused) {
      serverQueue.paused = true;
      if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.pause(true);
      updateQueue(message, serverQueue, message.pool);
      return message.channel.send("The playback has been stopped.");
    } else {
      return message.channel.send("The playback is already stopped.");
    }
  }
}