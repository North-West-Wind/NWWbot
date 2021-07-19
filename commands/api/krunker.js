const Discord = require("discord.js");
const { color } = require("../../function.js");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { run } = require("../../helpers/puppeteer");

module.exports = {
  name: "krunker",
  description: "Connect to the Krunker.io API and display stats.",
  aliases: ["kr"],
  usage: "<subcommand>",
  args: 1,
  category: 7,
  subcommands: ["stats", "server", "changelog"],
  subdesc: ["Display the stats of a Krunker player.", "Show all available Krunker servers.", "Fetch the changelog of Krunker."],
  subusage: ["<subcommand> <username>", "<subcommand> [search term]", "<subcommand> [version]"],
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "server", "Show all available Krunker servers.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "search", "The name of the server.")
    ]),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "changelog", "Fetch the changelog of Krunker.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "version", "The version of changelog to fetch.")
    ])
  ]),
  async slash(_client, _interaction, args) {
    if (args[0].name === "server") return InteractionResponse.sendMessage("Loading servers...");
    if (args[0].name === "changelog") return InteractionResponse.sendMessage("Loading changelogs...");
  },
  async postSlash(client, interaction, args) {
    const { author } = await InteractionResponse.createFakeMessage(client, interaction);
    var msg;
    if (args[0].name === "server") {
      const { id } = await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ data: { content: "Loading servers..." } });
      if (interaction.guild_id) msg = await (await client.channels.fetch(interaction.channel_id)).messages.fetch(id);
      else msg = await (await client.users.fetch(interaction.user.id)).messages.fetch(id);
      await this.server(msg, args[0]?.options[0]?.value || null, client, author);
    } else if (args[0].name === "changelog") {
      const { id } = await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ data: { content: "Loading changelogs..." } });
      if (interaction.guild_id) msg = await (await client.channels.fetch(interaction.channel_id)).messages.fetch(id);
      else msg = await (await client.users.fetch(interaction.user.id)).messages.fetch(id);
      await this.changelog(msg, args[0]?.options[0]?.value || null, author);
    }
  },
  async execute(message, args) {
    switch (args[0]) {
      case "stats":
        return await message.channel.send(`Sorry! Krunker added ReCaptcha to their social page. Now it is inaccessible :(.\nHowever here are some different subcommands you can try out: \`${this.subcommands.slice(1).join("`, `")}\``);
      case "server":
        var msg = await message.channel.send("Loading servers...");
        await this.server(msg, args.slice(1).join(" "), message.client, message.author);
        break;
      case "changelog":
        var msg = await message.channel.send("Loading changelogs...");
        await this.changelog(msg, args.slice(1).join(" "), message.author);
        break;
      default:
        return await message.channel.send(`Sorry! Krunker added ReCaptcha to their social page. Now it is inaccessible :(.\nHowever here are some different subcommands you can try out: \`${this.subcommands.slice(1).join("`, `")}\``);
    }
  },
  async server(msg, search, client, author) {
    try {
      const servers = await this.getServers();
      if (servers.error) throw new Error(servers.message);
      var official = [];
      var custom = [];
      if (!search) {
        official = servers.games.filter(x => !x[4].cs);
        custom = servers.games.filter(x => x[4].cs);
      } else {
        official = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && !x[4].cs);
        custom = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && x[4].cs);
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
      const officialColor = color();
      const customColor = color();
      for (let i = 0; i < officialPage; i++) {
        var str = "";
        for (let j = i * 25; j < i * 25 + 25; j++) if (official[j]) str += `${j + 1}. **[${official[j][4].i}](https://krunker.io/?game=${official[j][0]})** - **${official[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${official[j][2]}/${official[j][3]}**\n`
        str += `\nReact with 🎲 to get a random official game!\nReact with 🔗 to get a random official game in the specified region!\nReact with ⏩ to warp to a page!`
        const em = new Discord.MessageEmbed()
          .setTitle(`Official Games (${i + 1}/${officialPage})`)
          .setColor(officialColor)
          .setDescription(str)
          .setTimestamp()
          .setFooter(`There are ${officialPage} pages for official games.`, client.user.displayAvatarURL());
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
          .setFooter(`There are ${customPage} pages for custom games.`, client.user.displayAvatarURL());
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
      var collector = await msg.createReactionCollector((reaction, user) => (["🎲", "🔗", "⏩", "◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === author.id), {
        idle: 60000
      });
      const linkEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Random Game Generator")
        .setTimestamp()
        .setFooter("Please decide within 30 seconds.", client.user.displayAvatarURL());
      const pageWarp = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Krunker Server Browser")
        .setDescription("Enter the page number to warp to that page.")
        .setTimestamp()
        .setFooter("Please decide within 30 seconds.", client.user.displayAvatarURL());
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
            const collected = await msg.channel.awaitMessages(m => m.author.id === author.id, { max: 1, time: 30000 });
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
            const collected1 = await msg.channel.awaitMessages(m => m.author.id === author.id, { max: 1, time: 30000 });
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
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        var random = "";
        if (s > officialPage - 1) random = (`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
        else random = (`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
        if (random.endsWith("undefined")) random = "";
        setTimeout(() => msg.edit({ content: random.length > 0 ? `Here's a random server:\n${random}` : "No server was found!", embed: null }), 30000);
      });
    } catch (err) {
      NorthClient.storage.error(err);
      msg.edit(`<@${author.id}>, there was an error trying to show you the games!`);
    }
  },
  async changelog(msg, version, author) {
    try {
      const changelogs = await this.getChangelog();
      if (changelogs.error) throw new Error(changelogs.message);
      var changelog = {};
      changelog[Object.keys(changelogs).find(x => x.includes("UPDATE"))] = changelogs[Object.keys(changelogs).find(x => x.includes("UPDATE"))];
      if (version) {
        const key = Object.keys(changelogs).find(x => x.includes(version.toUpperCase()));
        if (!key) return await msg.channel.send("Cannot find any changelog with the supplied string!");
        changelog = {};
        changelog[key] = changelogs[key];
      }
      await msg.edit(`\`\`\`${Object.keys(changelog)[0]}\n${changelog[Object.keys(changelog)[0]].join("\n")}\`\`\``);
    } catch (err) {
      NorthClient.storage.error(err);
      msg.edit(`<@${author.id}>, there was an error trying to display the changelog!`);
    }
  },
  getServers: async() => await run(async (page) => {
    var result = { error: true };
    try {

      await page.goto("https://matchmaker.krunker.io/game-list?hostname=krunker.io");
      const element = await page.$("pre");
      const servers = JSON.parse(await (await element.getProperty('textContent')).jsonValue());
      servers.error = false;
      result = servers;
    } catch (err) {
      result.message = err.message;
    } finally {
      return result;
    }
  }),
  getChangelog: async() => await run(async (page) => {
    var result = { error: true };
    try {
      await page.goto("https://krunker.io/docs/versions.txt");
      const element = await page.$("pre");
      const text = await (await element.getProperty("textContent")).jsonValue();
      const lines = {};
      for (const x of text.split("\n\n")) {
        const morelines = x.split("\n");
        if (morelines[0] === "") morelines.shift();
        lines[morelines[0]] = morelines.slice(1);
      }
      result = lines;
    } catch (err) {
      result.message = err.message;
    } finally {
      return result;
    }
  })
};
