const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "queue",
  description: "Display the current song queue.",
  aliases: ["q"],
  usage: " ",
  music(message, serverQueue) {
    if (!serverQueue) return message.channel.send("There is nothing playing.");
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    var str;
    if(song.type === 0 || !song.type)
    str = `**${++index} - ** [**${song.title}**](${song.url}) : **${song.time}**`;
    else if(song.type === 1)
      str = `**${++index} - ** [**${song.title}**](${song.spot}) : **${song.time}**`;
    
    return str;
  });
    
    var all;
    
    if(songArray.join("\n").length > 2000) {
      all = songArray.slice(0, 20).join("\n") + "\nToo many songs...";
    } else {
      all = songArray.join("\n");
    }
    
    
  var queueEmbed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle("Song queue for " + message.guild.name)
  .setDescription("There are " + songArray.length + " songs in total.\n\n" + all)
  .setTimestamp()
  .setFooter("Now playing: " + serverQueue.songs[0].title, message.client.user.displayAvatarURL());
  message.channel.send(queueEmbed);
  }
}