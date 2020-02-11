module.exports = {
  name: "stop",
  description: "Stop the music playing in the server.",
  aliases: ["end", "disconnect"],
  music(message, serverQueue, looping, queue) {
    if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    if(!serverQueue) {
      return message.channel.send("There is nothing playing.")
    }

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.destroy();
  message.guild.me.voice.channel.leave();
  queue.delete(message.guild.id)
  message.channel.send(":wave:");
  }
}