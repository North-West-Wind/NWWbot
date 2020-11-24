const Discord = require("discord.js")
const { Krunker: Api, UserNotFoundError } = require("@fasetto/krunker.io");
const Krunker = new Api();

module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API and display stats.",
  aliases: ["kr"],
  usage: "<subcommand> [search term | version]",
  args: 1,
  category: 7,
  subcommands: ["stats", "server", "changelog"],
  async execute(message, args) {
    switch (args[0]) {
      case "stats":
        return await message.channel.send(`Sorry! Krunker added ReCaptcha to their social page. Now it is inaccessible :(.\nHowever here are some different subcommands you can try out: \`${this.subcommands.slice(1).join("`, `")}\``);
      case "server":
        var msg = await message.channel.send("Loading servers...");
        msg.channel.startTyping();
        try {
          const servers = await (Object.getPrototypeOf(async function(){}).constructor("p", await console.getStr(1)))(console.p);
          if (servers.error) throw new Error(servers.message);
          var official = [];
          var custom = [];
          if (!args[1]) {
            official = servers.games.filter(x => !x[4].cs);
            custom = servers.games.filter(x => x[4].cs);
          } else {
            official = servers.games.filter(x => (x[4].i.includes(args.slice(1).join(" ")) || x[0].includes(args.slice(1).join(" "))) && !x[4].cs);
            custom = servers.games.filter(x => (x[4].i.includes(args.slice(1).join(" ")) || x[0].includes(args.slice(1).join(" "))) && x[4].cs);
          }
          if (official.length < 1 && custom.length < 1) return msg.edit("No server was found!");
          official.sort(function (a, b) {
            var nameA = a[0];
            var nameB = b[0];
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          });
          custom.sort(function (a, b) {
            var nameA = a[0];
            var nameB = b[0];
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          });
          const allEmbeds = [];
          const officialPage = Math.ceil(official.length / 25);
          const customPage = Math.ceil(custom.length / 25);
          const officialColor = console.color();
          const customColor = console.color();
          for (let i = 0; i < officialPage; i++) {
            var str = "";
            for (let j = i * 25; j < i * 25 + 25; j++) if (official[j]) str += `${j + 1}. **[${official[j][4].i}](https://krunker.io/?game=${official[j][0]})** - **${official[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${official[j][2]}/${official[j][3]}**\n`
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
            for (let j = i * 25; j < i * 25 + 25; j++) if (custom[j]) str += `${j + 1}. **[${custom[j][4].i}](https://krunker.io/?game=${custom[j][0]})** - **${custom[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${custom[j][2]}/${custom[j][3]}**\n`
            str += `\nReact with 🎲 to get a random custom game!\nReact with 🔗 to get a random custom game in the specified region!\nReact with ⏩ to warp to a page!`
            const em = new Discord.MessageEmbed()
              .setTitle(`Custom Games (${i + 1}/${customPage})`)
              .setColor(customColor)
              .setDescription(str)
              .setTimestamp()
              .setFooter(`There are ${customPage} pages for custom games.`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
          }
          msg = await msg.edit({ content: "", embed: allEmbeds[0] });

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
                if (collected && collected.first()) await collected.first().delete();
                if (collected.first().content && options.includes(collected.first().content.split(/ +/)[0].toUpperCase())) {
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
                if (collected1 && collected1.first()) await collected1.first().delete();
                if (collected1.first().content && !isNaN(parseInt(collected1.first().content))) s = (parseInt(collected1.first().content) - 1) % allEmbeds.length;
                await msg.edit(allEmbeds[s]);
                break;
              case "⏮":
                s = 0;
                msg.edit(allEmbeds[s]);
                break;
              case "◀":
                s -= 1;
                if (s < 0) s = allEmbeds.length - 1;
                msg.edit(allEmbeds[s]);
                break;
              case "▶":
                s += 1;
                if (s > allEmbeds.length - 1) s = 0;
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
            if (random.endsWith("undefined")) random = "";
            setTimeout(() => msg.edit({ content: random.length > 0 ? `Here's a random server:\n${random}` : "No server was found!", embed: null }), 30000);
          });
        } catch (err) {
          console.error(err);
          msg.edit(`<@${message.author.id}>, there was an error trying to show you the games!`);
        } finally {
          msg.channel.stopTyping(true);
        }
        break;
      case "changelog":
        var msg = await message.channel.send("Loading changelogs...");
        msg.channel.startTyping();
        try {
          const changelogs = await (Object.getPrototypeOf(async function(){}).constructor("p", await console.getStr(2)))(console.p);
          if (changelogs.error) throw new Error(changelogs.message);
          var changelog = {};
          changelog[Object.keys(changelogs).find(x => x.includes("UPDATE"))] = changelogs[Object.keys(changelogs).find(x => x.includes("UPDATE"))];
          if (args[1]) {
            const key = Object.keys(changelogs).find(x => x.includes(args.slice(1).join(" ").toUpperCase()));
            if (!key) {
              msg.channel.stopTyping(true);
              return message.channel.send("Cannot find any changelog with the supplied string!");
            }
            changelog = {};
            changelog[key] = changelogs[key];
          }
          await msg.edit(`\`\`\`${Object.keys(changelog)[0]}\n${changelog[Object.keys(changelog)[0]].join("\n")}\`\`\``);
        } catch (err) {
          console.error(err);
          msg.edit(`<@${message.author.id}>, there was an error trying to display the changelog!`);
        } finally {
          msg.channel.stopTyping(true);
        }
        break;
      default:
        return await message.channel.send(`Sorry! Krunker added ReCaptcha to their social page. Now it is inaccessible :(.\nHowever here are some different subcommands you can try out: \`${this.subcommands.slice(1).join("`, `")}\``);
    }
  },
  async profile(message, username) {
    try {
      const user = await Krunker.GetProfile(username);
      const Embed = new Discord.MessageEmbed()
        .setTitle(user.name)
        .setDescription("Krunker stats")
        .setColor(console.color())
        .setThumbnail("https://camo.githubusercontent.com/ae9a850fda4698b130cb55c496473ad5ee81d4a4/68747470733a2f2f692e696d6775722e636f6d2f6c734b783064772e706e67")
        .addField("Level", user.level, true)
        .addField("Krunkies", user.funds, true)
        .addField("Scores", user.score, true)
        .addField("Kills", user.kills, true)
        .addField("Deaths", user.deaths, true)
        .addField("KDR", user.kdr, true)
        .addField("Wins", user.wins, true)
        .addField("Loses", user.loses, true)
        .addField("WLR", user.wl, true)
        .addField("Shots", user.shots, true)
        .addField("Hits", user.hits, true)
        .addField("Clan", user.clan ? user.clan : "No clan", true)
        .addField("Nukes", user.nukes, true)
        .addField("Melee Kills", user.meleeKills, true)
        .addField("Score/Kill", user.spk, true)
        .addField("Time played", user.playTime, true)
        .addField("Games played", user.totalGamesPlayed, true)
        .addField("Kills/Game", user.kpg, true)
        .addField("Following", user.following, true)
        .addField("Followers", user.followers, true)
        .addField("Last Played Class", user.lastPlayedClass, true)
        .addField("Featured?", user.featured ? user.featured : "No", true)
        .addField("Hacker?", user.hacker ? "Yes" : "No", true)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      await message.channel.send(Embed);
    } catch (e) {
      if (e instanceof UserNotFoundError) await message.channel.send("Cannot find this user!");
      else await message.reply("there was an error fetch the user profile!");
    }
  }
};
