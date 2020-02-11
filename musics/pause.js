module.exports = {
  name: "pause",
  description: "Pause the music playing on the server.",
  music(message, serverQueue) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");

  if (serverQueue.playing === true) {
    serverQueue.playing = false;
    serverQueue.connection.dispatcher.pause(true);
    return message.channel.send("The song playback has been stopped.");
  } else {
    return message.channel.send("The song playback is already stopped.");
  }
  }
}