const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits } = require("../function.js");
const { version } = require("../package.json");
const fetch = require("node-fetch");

module.exports = {
  name: "info",
  description: "Display information of the bot.",
  usage: " ",
  category: 6,
  async execute(message) {
    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };
    var dlcExist = false;
    try {
      var dlc = await message.guild.members.fetch(process.env.DLC);
      var dlcData = await fetch("https://nwwdlc--northwestwind.repl.co/api/status").then(resp => resp.json());
      dlcExist = true;
    } catch(err) {}
    
    if(dlcExist) {
      var readyAt = new Date(dlcData.readyAt);
      var dlcUptime = dlcData.uptime;
      var dlcVersion = dlcData.version;
      var dlcGuild = dlcData.guildCount;
      
      var date = readyAt.getDate();
        var month = readyAt.getMonth();
        var year = readyAt.getFullYear();
        var hour = readyAt.getHours();
        var minute = readyAt.getMinutes();
        var second = readyAt.getSeconds();

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
      
      var sec = dlcUptime / 1000;
                    var dd = Math.floor(sec / 86400);
                    var dh = Math.floor((sec % 86400) / 3600);
                    var dm = Math.floor(((sec % 86400) % 3600) / 60);
                    var ds = Math.floor(((sec % 86400) % 3600) % 60);
                    var dmi = Math.floor(
                      dlcUptime -
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
      
      var dlcEmbed = new Discord.MessageEmbed() 
    .setTitle("NWW DLC#0446")
    .setColor(color)
    .setThumbnail(message.client.user.displayAvatarURL())
    .setDescription("Made by NorthWestWind!\nVersion: **[" + dlcVersion + "](https://www.nwws.ml/news)**\n\nRunning on **" + dlcGuild + " servers**\nLast restart: **" + lastReady + "**\nUptime: **" + d + h + m + s + mi + "**")
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      
    }
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
    .setDescription("Made by NorthWestWind!\nVersion: **[" + version + "](https://www.nwws.ml/news)**\n\nRunning on **" + message.client.guilds.cache.size + " servers**\nLast restart: **" + lastReady + "**\nUptime: **" + d + h + m + s + mi + "**")
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    if(dlcEmbed) {
      var allEmbeds = [infoEmbed, dlcEmbed];
      var msg = await message.channel.send(allEmbeds[0]);
      
      var s = 0;
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
    } else 
    message.channel.send(infoEmbed);
  }
}