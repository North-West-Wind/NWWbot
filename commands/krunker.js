const Discord = require("discord.js")
const { Krunker: Api, UserNotFoundError } = require("@fasetto/krunker.io");
const Krunker = new Api();
const nodefetch = require("node-fetch");
const fetch = require("fetch-retry")(nodefetch, { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });

module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API and display stats.",
  aliases: ["kr"],
  usage: "<subcommand> <username | search term | [version]>",
  args: 1,
  category: 7,
  subcommands: ["stats", "server", "changelog"],
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
          .setColor(console.color())
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
        await msg.channel.startTyping();
        try {
          const servers = await fetch(`https://north-utils.glitch.me/krunker-servers`, { timeout: 30000 }).then(res => res.json());
          if(servers.error) throw new Error(servers.message);
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
          const officialColor = console.color();
          const customColor = console.color();
          for (let i = 0; i < officialPage; i++) {
            var str = "";
            for (let j = i * 25; j < i * 25 + 25; j++) {
              if(official[j]) str += `${j + 1}. **[${official[j][4].i}](https://krunker.io/?game=${official[j][0]})** - **${official[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${official[j][2]}/${official[j][3]}**\n`
            }
            str += `\nReact with 🎲 to get a random official game!\nReact with 🔗 to get a random official game in the specified region!\nReact with ⏩ to warp to a page!`
            const em = new Discord.MessageEmbed()
              .setTitle(`Official Games (${i + 1}/${officialPage})`)
              .setColor(officialColor)
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
            str += `\nReact with 🎲 to get a random custom game!\nReact with 🔗 to get a random custom game in the specified region!\nReact with ⏩ to warp to a page!`
            const em = new Discord.MessageEmbed()
              .setTitle(`Custom Games (${i + 1}/${customPage})`)
              .setColor(customColor)
              .setDescription(str)
              .setTimestamp()
              .setFooter(`There are ${customPage} pages for custom games.`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
          }
          msg = await msg.edit({ content: "", embed: allEmbeds[0]});

          var s = 0;
          await msg.react("🎲");
          await msg.react("🔗");
          await msg.react("⏩");
          await msg.react("⏮");
          await msg.react("◀");
          await msg.react("▶");
          await msg.react("⏭");
          await msg.react("⏹");
          var collector = await msg.createReactionCollector((reaction, user) => (["🎲", "🔗", "⏩", "◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === message.author.id), {
            idle: 60000,
            errors: ["time"]
          });
          const linkEmbed = new Discord.MessageEmbed()
            .setColor(console.color())
            .setTitle("Random Game Generator")
            .setTimestamp()
            .setFooter("Please decide within 30 seconds.", message.client.user.displayAvatarURL());
          const pageWarp = new Discord.MessageEmbed()
            .setColor(console.color())
            .setTitle("Krunker Server Browser")
            .setDescription("Enter the page number to warp to that page.")
            .setTimestamp()
            .setFooter("Please decide within 30 seconds.", message.client.user.displayAvatarURL());
          collector.on("collect", async function (reaction, user) {
            reaction.users.remove(user.id);
            switch (reaction.emoji.name) {
              case "🎲":
                if (s > officialPage - 1) msg.channel.send(`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                else msg.channel.send(`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                break;
              case "🔗":
                var options = [];
                if (s > officialPage - 1) options = Array.from(new Set(custom.map(x => x[0].split(":")[0])));
                else options = Array.from(new Set(official.map(x => x[0].split(":")[0])));
                linkEmbed.setDescription(`Available regions:\n**${options.join("\n")}**\n\nPlease type the region in the channel.`);
                await msg.edit({ content: "", embed: linkEmbed });
                const collected = await msg.channel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] });
                if(collected && collected.first()) await collected.first().delete();
                if(collected.first().content && options.includes(collected.first().content.split(/ +/)[0].toUpperCase())) {
                  const region = options.find(x => x === collected.first().content.split(/ +/)[0].toUpperCase());
                  var games = [];
                  if (s > officialPage - 1) games = custom.filter(x => x[0].startsWith(region));
                  else games = official.filter(x => x[0].startsWith(region));
                  msg.channel.send(`https://krunker.io/?game=${games[Math.floor(Math.random() * games.length)][0]}`);
                }
                await msg.edit(allEmbeds[s]);
                break;
              case "⏩":
                await msg.edit({ content: "", embed: pageWarp });
                const collected1 = await msg.channel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] });
                if(collected1 && collected1.first()) await collected1.first().delete();
                if(collected1.first().content && !isNaN(parseInt(collected1.first().content))) s = (parseInt(collected1.first().content) - 1) % allEmbeds.length;
                await msg.edit(allEmbeds[s]);
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
        } finally {
          await msg.channel.stopTyping(true);
        }
        break;
      case "changelog":
        var msg = await message.channel.send("Loading changelogs...");
        await msg.channel.startTyping();
        try {
          const changelogs = await fetch("https://north-utils.glitch.me/krunker-changelog").then(res => res.json());
          if(changelogs.error) throw new Error(changelogs.error);
          var changelog = {};
          changelog[Object.keys(changelogs).find(x => x.includes("UPDATE"))] = changelogs[Object.keys(changelogs).find(x => x.includes("UPDATE"))];
          if(args[1]) {
            const key = Object.keys(changelogs).find(x => x.includes(args.slice(1).join(" ").toUpperCase()));
            if(!key) {
              await msg.channel.stopTyping(true);
              return message.channel.send("Cannot find any changelog with the supplied string!");
            }
            changelog = {};
            changelog[key] = changelogs[key];
          }
          await message.channel.send(`\`\`\`${Object.keys(changelog)[0]}\n${changelog[Object.keys(changelog)[0]].join("\n")}\`\`\``);
        } catch(err) {
          console.error(err);
          msg.edit(`<@${message.author.id}>, there was an error trying to display the changelog!`);
        } finally {
          await msg.channel.stopTyping(true);
        }
      default:
        return message.channel.send("That's not a valid subcommand!" + ` Subcommands: \`${this.subcommands.join("`, `")}\``)
    }
  }
};
