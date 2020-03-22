module.exports = {
  name: "pause",
  description: "Pause the current music.",
  usage: " ",
  music(message, serverQueue) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
    
    if(!serverQueue) return message.channel.send("There is nothing playing.");

  if (serverQueue.paused === false) {
    serverQueue.paused = true;
    if(serverQueue.connection.dispatcher)
    serverQueue.connection.dispatcher.pause(true);
    return message.channel.send("The song playback has been stopped.");
  } else {
    return message.channel.send("The song playback is already stopped.");
  }
  }
}