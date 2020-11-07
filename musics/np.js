const Discord = require("discord.js");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
const { ms } = require("../function.js");

module.exports = {
  name: "np",
  description: "Display the music being played.",
  aliases: ["nowplaying"],
  category: 8,
  async music(message, serverQueue) {
    if (!serverQueue) return message.channel.send("There is nothing playing.");
    if(serverQueue.songs.length < 1) return message.channel.send("Nothing is in the queue now.");
    var position = 0;
    if(serverQueue.connection && serverQueue.connection.dispatcher) position = (serverQueue.connection.dispatcher.streamTime - serverQueue.startTime);
    var processBar = [];
    for(let i = 0; i < 20; i++) processBar.push("═");
    var progress = 0;
    var isLive = false;
    if(serverQueue.songs[0].time === "∞") isLive = true;
    else var length = ms(serverQueue.songs[0].time);
    if(isLive) {
      processBar.splice(19, 1, "█");
      var positionTime = "∞";
    } else {
      var positionTime = moment.duration(Math.round(position / 1000), "seconds").format();
      if(position === 0 || isNaN(position))
        positionTime = "0:00";
      progress = Math.floor((position / length) * processBar.length);
      processBar.splice(progress, 1, "█");
    }
    var info = [];
  var embed = new Discord.MessageEmbed()
    .setColor(console.color())
    .setTitle("Now playing:" + (serverQueue.playing ? "" : " (Not actually)"))
    .setTimestamp()
    .setFooter(`Looping: ${serverQueue.looping ? "Enabled" : "Disabled"} | Repeating: ${serverQueue.repeating ? "Enabled" : "Disabled"}`, message.client.user.displayAvatarURL());
    if(serverQueue.songs[0].type === 1) info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].spot})**\nLength: **${serverQueue.songs[0].time}**`, serverQueue.songs[0].thumbnail];
    else info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].url})**\nLength: **${serverQueue.songs[0].time}**`, serverQueue.songs[0].thumbnail];
    embed.setDescription(`${info[0]}\n\n${positionTime} **${processBar.join("")}** ${serverQueue.songs[0].time}`).setThumbnail(info[1]);
  return message.channel.send(embed).then(msg => {
    setTimeout(() => {
      msg.edit({ embed: null, content: "**[Insert Displayed Information Here]**" });
    }, 30000);
  });
  }
}