module.exports = {
  name: "volume",
  description: "Turn the volume of music up or down by percentage.",
  usage: "<percentage>",
  aliases: ["vol"],
  async music(message, serverQueue) {
    var args = message.content.split(" ");
    if(!args[1]) return message.channel.send(`The current volume is **${Math.round(serverQueue.volume * 100)}%**.`);
    if(!serverQueue) return message.channel.send("There is nothing playing. Volume didn't change.");
    if(isNaN(Number(args[1]))) return message.channel.send("The percentage change you gave is no a number!");
    serverQueue.volume += Number(args[1]) / 100;
    if(serverQueue.volume > 10) serverQueue.volume = 10;
    if(serverQueue.volume < 0) serverQueue.volume = 0;
    if(serverQueue.connection && serverQueue.playing && serverQueue.connection.dispatcher) {
      serverQueue.connection.dispatcher.setVolume(serverQueue.volume);
    }
    message.channel.send("Volume has been changed to **" + Math.round(serverQueue.volume * 100) + "%**.");
  }
}