const Discord = require("discord.js")
var color = Math.floor(Math.random() * 16777214) + 1;
const { Krunker: Api, OrderBy, UserNotFoundError } = require("@fasetto/krunker.io");
const Krunker = new Api();

module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API and display stats.",
  aliases: ["kr"],
  usage: "<username>",
  args: true,
  category: 7,
  async execute(message, args) {
    if(!args[0]) {
      return message.channel.send("No username provided!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``)
    }
    try {
      var user = await Krunker.GetProfile(args.join(" "));
    } catch(e) {
      if (e instanceof UserNotFoundError)
        console.log("Sorry ):\nWe couldn't find that user!");
      else
        console.log(e.message);
    }
    
    var level = user.level;
    var name = user.name;
    var kills = user.kills;
    var deaths = user.deaths;
    var score = user.score;
    var kdr = user.kdr;
    var wins = user.wins;
    var loses = user.loses;
    var wlr = user.wl;
    var clan = user.clan;
    var playTime = user.playTime;
    var featured = user.featured;
    var hacker = user.hacker ? "Yes" : "No";
    var spk = user.spk;
    var played = user.totalGamesPlayed;
    var kr = user.funds;
    
    var kpg = user.kpg;
    var following = user.following;
    var followers = user.followers;
    var shots = user.shots;
    var hits = user.hits;
    var nukes = user.nukes;
    var melee = user.meleeKills;
    var lastClass = user.lastPlayedClass;
    
    const Embed = new Discord.MessageEmbed()
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
    
      .addField("Shots", shots, true)
      .addField("Hits", hits, true)
      .addField("Clan", clan, true)
    
      .addField("Nukes", nukes, true)
      .addField("Melee Kills", melee, true)
      .addField("Score/Kill", spk, true)
    
      .addField("Time played", playTime, true)
      .addField("Games played", played, true)
      .addField("Kills/Game", kpg, true)
    
      .addField("Following", following, true)
      .addField("Followers", followers, true)
      .addField("Last Played Class", lastClass, true)
    
      .addField("Featured?", featured, true)
      .addField("Hacker?", hacker, true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);
  }
};
