var color = Math.floor(Math.random() * 16777214) + 1;
const Discord = require("discord.js");
const client = new Discord.Client();
const { findUser, findMember, twoDigits } = require("../function.js")
module.exports = {
  name: "profile",
  description: "Display profile of yourself or the mentioned user on the server.",
  usage: "[user | user ID]",
  async execute(message, args) {
    if (!args[0]) {
      const member = message.member;
      const user = member.user;
      const username = user.username;
      const tag = user.tag;
      const id = user.id;
      const createdAt = user.createdAt;
      const joinedAt = member.joinedAt;
      const nick = member.displayName;
      const status = member.presence.status;
      
      var date = createdAt.getDate();
        var month = createdAt.getMonth();
        var year = createdAt.getFullYear();
        var hour = createdAt.getHours();
        var minute = createdAt.getMinutes();
        var second = createdAt.getSeconds();
      
      var createdTime =
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
      
      var jdate = joinedAt.getDate();
        var jmonth = joinedAt.getMonth();
        var jyear = joinedAt.getFullYear();
        var jhour = joinedAt.getHours();
        var jminute = joinedAt.getMinutes();
        var jsecond = joinedAt.getSeconds();
      
      var joinedTime =
          twoDigits(jdate) +
          "/" +
          twoDigits(jmonth + 1) +
          "/" +
          twoDigits(jyear) +
          " " +
          twoDigits(jhour) +
          ":" +
          twoDigits(jminute) +
          ":" +
          twoDigits(jsecond) +
          " UTC";
      
      const Embed = new Discord.MessageEmbed()
        .setTitle("Profile of " + username)
        .setDescription("In server **" + message.guild.name + "**")
        .setThumbnail(user.displayAvatarURL())
        .addField("ID", id, true)
        .addField("Username", tag, true)
        .addField("Status", status, true)
        .addField("Nickname", nick, true)
        .addField("Created", createdTime, true)
        .addField("Joined", joinedTime, true)
        .setColor(color)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      message.channel.send(Embed);
    } else {
      if (message.channel instanceof Discord.DMChannel) {
       return message.channel.send("Mentions in this command only works in servers.")
     }
      
      const member = await findMember(message, args[0]);
      if(!member) return;
      const user = member.user;
      const username = user.username;
      const tag = user.tag;
      const id = user.id;
      const createdAt = user.createdAt;
      const joinedAt = member.joinedAt;
      const nick = member.displayName;
      const status = member.presence.status;
      
      var date = createdAt.getDate();
        var month = createdAt.getMonth();
        var year = createdAt.getFullYear();
        var hour = createdAt.getHours();
        var minute = createdAt.getMinutes();
        var second = createdAt.getSeconds();
      
      var createdTime =
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
      
      var jdate = joinedAt.getDate();
        var jmonth = joinedAt.getMonth();
        var jyear = joinedAt.getFullYear();
        var jhour = joinedAt.getHours();
        var jminute = joinedAt.getMinutes();
        var jsecond = joinedAt.getSeconds();
      
      var joinedTime =
          twoDigits(jdate) +
          "/" +
          twoDigits(jmonth + 1) +
          "/" +
          twoDigits(jyear) +
          " " +
          twoDigits(jhour) +
          ":" +
          twoDigits(jminute) +
          ":" +
          twoDigits(jsecond) +
          " UTC";
      
      const Embed = new Discord.MessageEmbed()
        .setTitle("Profile of " + username)
        .setDescription("In server **" + message.guild.name + "**")
        .setThumbnail(user.displayAvatarURL())
        .addField("ID", id, true)
        .addField("Username", tag, true)
        .addField("Status", status, true)
        .addField("Nickname", nick, true)
        .addField("Created", createdTime, true)
        .addField("Joined", joinedTime, true)
        .setColor(color)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      message.channel.send(Embed);
      
    }
  }
};
