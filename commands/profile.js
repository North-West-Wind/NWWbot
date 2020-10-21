var color = Math.floor(Math.random() * 16777214) + 1;
const Discord = require("discord.js");
const { findMember, twoDigits } = require("../function.js");
module.exports = {
  name: "profile",
  description:
    "Display profile of yourself or the mentioned user on the server.",
  usage: "[user | user ID]",
  category: 6,
  async execute(message, args) {
    if (!args[0]) {
      var member = message.member;
    } else {
      var member = await findMember(message, args[0]);
    }
    if (!member) return;
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

    var allEmbeds = [Embed];

    if (member.presence.activities.length > 0) {
      const activityEm = new Discord.MessageEmbed()
        .setTitle("Presence of " + username)
        .setTimestamp()
        .setColor(color)
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      for (const activity of member.presence.activities) {
        var time = Date.now() - activity.createdTimestamp;
        var sec = time / 1000;
        var dd = Math.floor(sec / 86400);
        var dh = Math.floor((sec % 86400) / 3600);
        var dm = Math.floor(((sec % 86400) % 3600) / 60);
        var ds = Math.floor(((sec % 86400) % 3600) % 60);
        var dmi = Math.floor(
          time - dd * 86400000 - dh * 3600000 - dm * 60000 - ds * 1000
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
        activityEm.addField(
          activity.type.replace(/_/g, " "),
          `Name: **${activity.name}**\nDuration: ${d + h + m + s + mi}`
        );
      }
      allEmbeds.push(activityEm);
    }
    if (allEmbeds.length == 1) message.channel.send(Embed);
    else {
      const filter = (reaction, user) => {
        return (
          ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };
      var s = 0;
      var msg = await message.channel.send(allEmbeds[0]);

      await msg.react("⏮");
      await msg.react("◀");
      await msg.react("▶");
      await msg.react("⏭");
      await msg.react("⏹");
      var collector = await msg.createReactionCollector(filter, {
        idle: 60000,
        errors: ["time"]
      });

      collector.on("collect", function(reaction, user) {
        reaction.users.remove(user.id);
        switch (reaction.emoji.name) {
          case "⏮":
            s = 0;
            msg.edit(allEmbeds[s]);
            break;
          case "◀":
            s -= 1;
            if (s < 0) {
              s = allEmbeds.length - 1;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "▶":
            s += 1;
            if (s > allEmbeds.length - 1) {
              s = 0;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "⏭":
            s = allEmbeds.length - 1;
            msg.edit(allEmbeds[s]);
            break;
          case "⏹":
            collector.emit("end");
            break;
        }
      });
      collector.on("end", function() {
        msg.reactions.removeAll().catch(console.error);
      });
    }
  }
};
