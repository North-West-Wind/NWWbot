const { updateQueue } = require("./play");

module.exports = {
  name: "pause",
  description: "Pause the current music.",
  category: 8,
  music(message, serverQueue, queue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to pause the music when the bot is playing!");
    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return message.channel.send("There is nothing playing.");
    if (!serverQueue.paused) {
      serverQueue.paused = true;
      if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.pause(true);
      updateQueue(message, serverQueue, queue, message.pool);
      return message.channel.send("The song playback has been stopped.");
    } else {
      return message.channel.send("The song playback is already stopped.");
    }
  }
}