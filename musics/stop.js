const { updateQueue } = require("./main");

module.exports = {
  name: "stop",
  description: "Stop the music and disconnect the bot from the voice channel.",
  aliases: ["end", "disconnect", "dis"],
  category: 8,
  async music(message, serverQueue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue?.playing) return await message.channel.send("You have to be in a voice channel to stop the music when the bot is playing!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    if (message.guild.me.voice.channel) {
      await message.guild.me.voice.channel.leave();
      await message.channel.send(":wave:");
    } else await message.channel.send("Re-stopped");
    updateQueue(message, serverQueue, null);
  }
}