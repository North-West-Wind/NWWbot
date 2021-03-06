const { updateQueue } = require("./main.js");

module.exports = {
  name: "volume",
  description: "Turn the volume of music up or down by percentage.",
  usage: "[percentage]",
  aliases: ["vol"],
  category: 8,
  async music(message, serverQueue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    if(!args[1]) return message.channel.send(`The current volume is **${Math.round(serverQueue.volume * 100)}%** and the current volume of the soundtrack is **${Math.round(serverQueue.volume * (serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.songs[0].volume : 1) * 100)}%**`);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (!serverQueue.songs.length) return await message.channel.send("There is nothing playing. Volume didn't change.");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the volume when the bot is playing!");
    if(isNaN(Number(args[1]))) return message.channel.send("The percentage change you gave is no a number!");
    if(args[2] && args[2].toLowerCase() == "np") {
      if(serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue. You cannot change the current soundtrack volume.");
      if(!isNaN(serverQueue.songs[0].volume)) serverQueue.songs[0].volume += Number(args[1]) / 100;
      else serverQueue.songs[0].volume = 1 + (Number(args[1]) / 100);
      if(serverQueue.songs[0].volume > 10) serverQueue.songs[0].volume = 10;
      if(serverQueue.songs[0].volume < 0) serverQueue.songs[0].volume = 0;
      message.channel.send("Volume of the current soundtrack has been changed to **" + (serverQueue.volume * serverQueue.songs[0].volume * 100) + "%**.");
    } else {
      serverQueue.volume += Number(args[1]) / 100;
      if(serverQueue.volume > 10) serverQueue.volume = 10;
      if(serverQueue.volume < 0) serverQueue.volume = 0;
      message.channel.send("Volume has been changed to **" + (serverQueue.volume * 100) + "%**.");
    }
    if(serverQueue.connection && serverQueue.playing && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.setVolume(serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.volume * serverQueue.songs[0].volume : serverQueue.volume);
    updateQueue(message, serverQueue, null);
  }
}