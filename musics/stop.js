module.exports = {
  name: "stop",
  description: "Stop the music and disconnect the bot from the voice channel.",
  aliases: ["end", "disconnect"],
  usage: " ",
  music(message, serverQueue, looping, queue, pool) {
    const guild = message.guild;
    if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    if(!serverQueue) {
      return message.channel.send("There is nothing playing.")
    }

    if(serverQueue.connection != null && serverQueue.connection.dispatcher)
  serverQueue.connection.dispatcher.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
  if(message.guild.me.voice.channel)
  message.guild.me.voice.channel.leave();
  message.channel.send(":wave:");
  }
}