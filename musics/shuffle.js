const Discord = require("discord.js");
const { shuffleArray } = require("../function.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "shuffle",
  description: "Shuffle the song queue.",
  music(message, serverQueue) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");

  if (!serverQueue) return message.channel.send("There is nothing playing.");
  shuffleArray(serverQueue.songs);
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    return `**${++index}-** [${song.title}](${song.url})`;
  });
  var queueEmbed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle("Song queue for " + message.guild.name)
  .setDescription("There are " + songArray.length + " songs in total.\n\n" + songArray.join("\n"))
  .setTimestamp()
  .setFooter("Now playing: " + serverQueue.songs[0].title, message.client.user.displayAvatarURL());
  message.channel.send("Song queue has been shuffled.", queueEmbed);
  }
}