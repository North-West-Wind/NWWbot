const { updateQueue } = require("./play.js");
module.exports = {
  name: "clear",
  description: "Clear the song queue and stop the playing soundtrack. Also resets the volume to 100%.",
  category: 8,
  music(message, serverQueue, queue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to clear the queue when the bot is playing!");
    if (serverQueue && serverQueue.connection != null && serverQueue.connection.dispatcher)
      serverQueue.connection.dispatcher.destroy();
    if (message.guild.me.voice.channel)
      message.guild.me.voice.channel.leave();
    updateQueue(message, null, queue);
    message.channel.send("The queue has been cleared!");
  }
};
