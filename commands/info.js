const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits } = require("../function.js");
const { version } = require("../package.json")

module.exports = {
  name: "info",
  description: "Display information of the bot.",
  usage: " ",
  execute(message) {
    var date = message.client.readyAt.getDate();
        var month = message.client.readyAt.getMonth();
        var year = message.client.readyAt.getFullYear();
        var hour = message.client.readyAt.getHours();
        var minute = message.client.readyAt.getMinutes();
        var second = message.client.readyAt.getSeconds();

        var lastReady =
          twoDigits(date) +
          "/" +
          twoDigits(month + 1) +
          "/" +
          twoDigits(year) +
          " " +
          twoDigits(hour) +
          ":" +
          twoDigits(minute) +
          ":" +
          twoDigits(second) +
          " UTC";
    
    var time = message.client.uptime;
    var sec = time / 1000;
                    var dd = Math.floor(sec / 86400);
                    var dh = Math.floor((sec % 86400) / 3600);
                    var dm = Math.floor(((sec % 86400) % 3600) / 60);
                    var ds = Math.floor(((sec % 86400) % 3600) % 60);
                    var dmi = Math.floor(
                      time -
                        dd * 86400000 -
                        dh * 3600000 -
                        dm * 60000 -
                        ds * 1000
                    );
                    var d = "";
                    var h = "";
                    var m = "";
                    var s = "";
                    var mi = "";
                    if (dd !== 0) {
                      d = " " + dd + " days";
                    }
                    if (dh !== 0) {
                      h = " " + dh + " hours";
                    }
                    if (dm !== 0) {
                      m = " " + dm + " minutes";
                    }
                    if (ds !== 0) {
                      s = " " + ds + " seconds";
                    }
                    if (dmi !== 0) {
                      mi = " " + dmi + " milliseconds";
                    }
    
    
    const infoEmbed = new Discord.MessageEmbed() 
    .setTitle(message.client.user.tag)
    .setColor(color)
    .setThumbnail(message.client.user.displayAvatarURL())
    .setDescription("Made by NorthWestWind!\nVersion: **" + version + "**\n\nRunning on **" + message.client.guilds.cache.size + " servers**\nLast restart: **" + lastReady + "**\nUptime: **" + d + h + m + s + mi + "**")
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    message.channel.send(infoEmbed);
  }
}