const KrunkerJS = require("krunker.js");
const krunker = new KrunkerJS();
const Discord = require("discord.js")
var color = Math.floor(Math.random() * 16777214) + 1;
module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API.",
  aliases: ["kr"],
  usage: "<name>",
  args: true,
  execute(message, args) {
    krunker.getUser(args[0]).then(data => {
      const sim = data.simplified;
      const name = sim.name;
      const score = sim.score;
      const level = sim.level;
      const kills = sim.kills;
      const deaths = sim.deaths;
      const playTime = krunker.getPlayTime(data);
      // Get user KDR
      const kdr = krunker.getKDR(data);
      // Get W/L
      const wlr = krunker.getWL(data);
      // Get SPK
      const spk = krunker.getSPK(data);
      const wins = sim.wins;
      const loses = sim.loses;
      const played = sim.totalGamesPlayed;
      const kr = sim.krunkies;
      const clan = sim.clan
      if(sim.featured === 1) {
      var featured = "Yes"
      } else {
      var featured = "No"
      }
      if(sim.hacker === 1) {
        var hacker = "Yes"
      } else {
        var hacker = "No"
      }
      
      const Embed = new Discord.RichEmbed()
      .setTitle(name)
      .setDescription("Krunker stats")
      .setColor(color)
      .setThumbnail("https://camo.githubusercontent.com/ae9a850fda4698b130cb55c496473ad5ee81d4a4/68747470733a2f2f692e696d6775722e636f6d2f6c734b783064772e706e67")
      .addField("Level", level, true)
      .addField("Krunkies", kr, true)
      .addField("Scores", score, true)
      .addField("Kills", kills, true)
      .addField("Deaths", deaths, true)
      .addField("KDR", kdr, true)
      .addField("Wins", wins, true)
      .addField("Loses", loses, true)
      .addField("WLR", wlr, true)
      .addField("Clan", clan, true)
      .addField("Time played", playTime, true)
      .addField("Games played", played, true)
      .addField("Score/Kill", spk, true)
      .addField("Featured?", featured, true)
      .addField("Hacker?", hacker, true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);
      
      
      
    }).catch(err => {
      console.log(err)
      message.channel.send("User not found.")
    });
  }
};
