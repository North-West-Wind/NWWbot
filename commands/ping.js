const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

module.exports = {
  name: "ping",
  description: "Ping!",
  execute(message, args) {
    var msgDate = new Date(message.createdTimestamp);

    var date = msgDate.getDate();
    var month = msgDate.getMonth();
    var year = msgDate.getFullYear();
    var hour = msgDate.getHours();
    var minute = msgDate.getMinutes();
    var second = msgDate.getSeconds();
    var millisecond = msgDate.getMilliseconds();

    var msgTime =
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
      "." +
      twoDigits(millisecond) +
      " UTC";

    var currentDate = new Date();
    var cdate = currentDate.getDate();
    var cmonth = currentDate.getMonth();
    var cyear = currentDate.getFullYear();
    var chour = currentDate.getHours();
    var cminute = currentDate.getMinutes();
    var csecond = currentDate.getSeconds();
    var cmillisecond = currentDate.getMilliseconds();

    var currentTime =
      twoDigits(cdate) +
      "/" +
      twoDigits(cmonth + 1) +
      "/" +
      twoDigits(cyear) +
      " " +
      twoDigits(chour) +
      ":" +
      twoDigits(cminute) +
      ":" +
      twoDigits(csecond) +
      "." +
      twoDigits(cmillisecond) +
      " UTC";

    const Embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle("Ping")
      .addField("Message sent", "`" + msgTime + "`")
      .addField("Message received", "`" + currentTime + "`")
      .addField("Ping", "`" + (currentDate - msgDate) + "ms`")
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);
    message.author.send("Pong! Don't question me. I'm online.")
  }
};
