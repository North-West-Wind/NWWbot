const Discord = require("discord.js")
var color = Math.floor(Math.random() * 16777214) + 1;
const { Krunker: Api, UserNotFoundError } = require("@fasetto/krunker.io");
const Krunker = new Api();
const fetch = require("node-fetch");

module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API and display stats.",
  aliases: ["kr"],
  usage: "<subcommand> <username | search term>",
  args: 1,
  category: 7,
  subcommands: ["stats", "server"],
  async execute(message, args) {
    switch (args[0]) {
      case "stats":
        if (!args[1]) return message.channel.send("Please enter the username and try again.");
        try {
          var user = await Krunker.GetProfile(args.join(" "));
        } catch (e) {
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
        break;
      case "server":
        var msg = await message.channel.send("Loading servers...");
        try {
          const servers = await fetch(`https://NWWDLC.northwestwind.repl.co/api/krunker/servers/${process.env.KEY}`).then(res => res.json());
          var official = [];
          var custom = [];
          if (!args[1]) {
            official = servers.games.filter(x => !x[4].cs);
            custom = servers.games.filter(x => x[4].cs);
          } else {
            official = servers.games.filter(x => (x[4].i.includes(args.slice(1).join(" ")) || x[0].includes(args.slice(1).join(" "))) && !x[4].cs);
            custom = servers.games.filter(x => (x[4].i.includes(args.slice(1).join(" ")) || x[0].includes(args.slice(1).join(" "))) && x[4].cs);
          }
          if(official.length < 1 && custom.length < 1) return msg.edit("No server was found!");
          official.sort(function(a, b) {
            var nameA = a[0];
            var nameB = b[0];
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          custom.sort(function(a, b) {
            var nameA = a[0];
            var nameB = b[0];
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          const allEmbeds = [];
          const officialPage = Math.ceil(official.length / 25);
          const customPage = Math.ceil(custom.length / 25);
          for (let i = 0; i < officialPage; i++) {
            var str = "";
            for (let j = i * 25; j < i * 25 + 25; j++) {
              if(official[j]) str += `${j + 1}. **[${official[j][4].i}](https://krunker.io/?game=${official[j][0]})** - **${official[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${official[j][2]}/${official[j][3]}**\n`
            }
            str += `\nReact with 🎲 to get a random official game!`
            const em = new Discord.MessageEmbed()
              .setTitle(`Official Games (${i + 1}/${officialPage})`)
              .setColor(color)
              .setDescription(str)
              .setTimestamp()
              .setFooter(`There are ${officialPage} pages for official games.`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
          }
          for (let i = 0; i < customPage; i++) {
            var str = "";
            for (let j = i * 25; j < i * 25 + 25; j++) {
              if(custom[j]) str += `${j + 1}. **[${custom[j][4].i}](https://krunker.io/?game=${custom[j][0]})** - **${custom[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${custom[j][2]}/${custom[j][3]}**\n`
            }
            str += `\nReact with 🎲 to get a random custom game!`
            const em = new Discord.MessageEmbed()
              .setTitle(`Custom Games (${i + 1}/${customPage})`)
              .setColor(color)
              .setDescription(str)
              .setTimestamp()
              .setFooter(`There are ${customPage} pages for custom games.`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
          }
          msg = await msg.edit({ content: "", embed: allEmbeds[0]});

          var s = 0;
          await msg.react("🎲");
          await msg.react("⏮");
          await msg.react("◀");
          await msg.react("▶");
          await msg.react("⏭");
          await msg.react("⏹");
          var collector = await msg.createReactionCollector((reaction, user) => (["🎲", "◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === message.author.id), {
            idle: 60000,
            errors: ["time"]
          });

          collector.on("collect", function (reaction, user) {
            reaction.users.remove(user.id);
            switch (reaction.emoji.name) {
              case "🎲":
                if (s > officialPage - 1) msg.channel.send(`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                else msg.channel.send(`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                break;
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
          collector.on("end", async function () {
            await msg.reactions.removeAll().catch(console.error);
            var random = "";
            if (s > officialPage - 1) random = (`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
            else random = (`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
            if(random.endsWith("undefined")) random = "";
            setTimeout(() => msg.edit({ content: random.length > 0 ? `Here's a random server:\n${random}` : "No server was found!", embed: null }), 30000);
          });
        } catch (err) {
          console.error(err);
          msg.edit(`<@${message.author.id}>, there was an error trying to show you the games!`);
        }
        break;
      default:
        return message.channel.send("That's not a valid subcommand!" + ` Subcommands: \`${this.subcommands.join("`, `")}\``)
    }
  }
};
