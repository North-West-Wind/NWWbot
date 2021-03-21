const Discord = require("discord.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const { color, getKeyByValue, createEmbedScrolling, nameToUuid, profile, nameHistory } = require("../../function");
const { curseforge, SectionTypes, CategoryList, SortTypes } = require("aio-mc-api");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandOptionChoice, InteractionResponse } = require("../../classes/Slash");

module.exports = {
  name: "minecraft",
  description: "Connect to the Minecraft API and display information.",
  args: true,
  aliases: ["mc"],
  usage: "[subcommand] <username | UUID | IP>",
  subcommands: ["profile", "server", "history", "curseforge"],
  subaliases: ["pro", "srv", "his", "cf"],
  subdesc: ["Display the profile of a Minecraft player.", "Fetch information about a Minecraft server.", "Show the username history of a Minecraft player.", "Fetch projects from CurseForge Minecraft."],
  subusage: [null, "<subcommand> <IP>", null, "<subcommand> [section | category] [version] [sort] [keywords]"],
  category: 7,
  args: 1,
  slashInit: true,
  slashWait: true,
  async register() {
    const sortChoices = []
    for (const sort in SortTypes) sortChoices.push(new ApplicationCommandOptionChoice(sort.toLowerCase(), sort));
    return ApplicationCommand.createBasic(module.exports).setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[0], this.subdesc[0]).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "username", "The username or UUID of the player.").setRequired(true)
      ]),
      new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[1], this.subdesc[1]).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "ip", "The IP of the server.").setRequired(true)
      ]),
      new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[2], this.subdesc[2]).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "username", "The username or UUID of the player.").setRequired(true)
      ]),
      new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[3], this.subdesc[3]).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "category", "The category of CurseForge project to search."),
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "version", "The version of the game."),
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "sort", "The way to sort projects.").setChoices(sortChoices),
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The project to search for.")
      ])
    ])
  },
  async slash(client, _interaction, args) {
    if (args[0].name === this.subcommands[0]) {
      var str = args[0].options[0].value;
      var em;
      if (str.length <= 16) {
        const uuid = await nameToUuid(str);
        if (!uuid) return InteractionResponse.sendMessage("No player named **" + str + "** were found")
        const r = await profile(uuid);
        em = this.getProfileEmbed(r, client);
      } else {
        const res = await profile(str);
        em = this.getProfileEmbed(res, client);
      }
      return InteractionResponse.sendEmbeds(em);
    } else if (args[0].name === this.subcommands[1]) {
      return InteractionResponse.wait();
    } else if (args[0].name === this.subcommands[2]) {
      const res = await nameToUuid(args[0].options[0].value, true);
      if (!res[0]) return InteractionResponse.sendMessage("No player named **" + args[0].options[0].value + "** were found");
      return InteractionResponse.sendMessage(await this.getHistoryEmbed(res, client));
    } else if (args[0].name === this.subcommands[3]) return InteractionResponse.ackknowledge();
  },
  async postSlash(client, interaction, args) {
    if (args[0].name === this.subcommands[1]) {
      const url = `https://api.mcsrvstat.us/2/${args[0].options[0].value}`;
      const res = await fetch(url);
      if (!res.ok) return InteractionResponse.createResponse(client, interaction, InteractionResponse.sendMessage("Received HTTP Status Code " + res.status));
      const body = await res.json();
      if (body.online) return InteractionResponse.createResponse(client, interaction, InteractionResponse.sendEmbeds(this.getServerEmbed(body, client, args[0].options[0].value)));
      else return InteractionResponse.createResponse(client, interaction, InteractionResponse.sendMessage("The server - **" + args[0].options[0].value + "** - is offline/under maintenance."));
    } else if (args[0].name === this.subcommands[3]) {
      const cArgs = ["0"].concat(args[0].options.filter(x => !!x).map(x => x.value));
      await this.cf(await InteractionResponse.createFakeMessage(client, interaction), cArgs);
    }
  },
  async execute(message, args) {
    if (args[0] === "profile" || args[0] === "pro" || !args[1]) {
      var str = args[0];
      if (args[1]) str = args[1];
      var em;
      if (str.length <= 16) {
        const uuid = await nameToUuid(str);
        if (!uuid) return message.channel.send("No player named **" + str + "** were found")
        const r = await profile(uuid);
        em = this.getProfileEmbed(r, message.client);
      } else {
        const res = await profile(str);
        em = this.getProfileEmbed(res, message.client);
      }
      await message.channel.send(em);
    } else if (args[0] === "server" || args[0] === "srv") {
      const url = `https://api.mcsrvstat.us/2/${args.slice(1).join(" ")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Received HTTP Status Code " + res.status);
      const body = await res.json();
      if (body.online) return message.channel.send(this.getServerEmbed(body, message.client, args.slice(1).join(" ")));
      else return message.channel.send("The server - **" + args.slice(1).join(" ") + "** - is offline/under maintenance.");
    } else if (args[0] === "history" || args[0] === "his") {
      const res = await nameToUuid(args[1], true);
      if (!res[0]) return message.channel.send("No player named **" + args[1] + "** were found");
      await message.channel.send(await this.getHistoryEmbed(res, message.client));
    } else if (args[0] === "curseforge" || args[0] === "cf") return await this.cf(message, args);
  },
  async cf(message, args) {
    var category = SectionTypes.MOD;
    var version;
    var sort = SortTypes.POPULARITY;
    var filter;
    if (SectionTypes[args[1].toUpperCase()] || CategoryList[args[1].toUpperCase()]) {
      category = SectionTypes[args[1].toUpperCase()] || CategoryList[args[1].toUpperCase()];
      if (args[2].match(/^[\d+\.?]+$/)) {
        version = args[2];
        if (SortTypes[args[3].toUpperCase()]) {
          sort = SortTypes[args[3].toUpperCase()];
          if (args[4]) filter = args.slice(4).join(" ");
        } else {
          if (args[3]) filter = args.slice(3).join(" ");
        }
      } else {
        if (SortTypes[args[2].toUpperCase()]) {
          sort = SortTypes[args[2].toUpperCase()];
          if (args[3]) filter = args.slice(3).join(" ");
        } else {
          if (args[2]) filter = args.slice(2).join(" ");
        }
      }
    } else {
      if (args[1].match(/^[\d+\.?]+$/)) {
        version = args[1];
        if (SortTypes[args[2].toUpperCase()]) {
          sort = SortTypes[args[2].toUpperCase()];
          if (args[3]) filter = args.slice(3).join(" ");
        } else {
          if (args[2]) filter = args.slice(2).join(" ");
        }
      } else {
        if (SortTypes[args[1].toUpperCase()]) {
          sort = SortTypes[args[1].toUpperCase()];
          if (args[2]) filter = args.slice(2).join(" ");
        } else {
          if (args[1]) filter = args.slice(1).join(" ");
        }
      }
    }
    const projects = await curseforge.searchProject({ category, gameVersion: version, sort, filter, pageSize: 100 });
    const allEmbeds = [];
    var categories = CategoryList;
    for (let i = 0; i < Math.ceil(projects.length / 10); i++) {
      const em = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`CurseForge Minecraft - ${getKeyByValue(Object.assign(categories, SectionTypes), category)}`)
        .setDescription(`Sort by: **${getKeyByValue(SortTypes, sort)}**\nVersion: **${version ? version : "All"}**\nFilter: ${filter ? `**${filter}**` : "None"}\n\n`)
        .setTimestamp()
        .setFooter(`Page ${i + 1}/${Math.ceil(projects.length / 10)}`, message.client.user.displayAvatarURL());
      for (let u = 0; u < Math.min(10, projects.length - 10 * i); u++) {
        const project = projects[i * 10 + u];
        em.setDescription(em.description + `**[${project.section.name}: ${project.name} - ${project.authors.map(a => a.name).join(", ")}](${project.url})**\n`);
      }
      em.setDescription(em.description + "React with ◀, ▶, ⏮, ⏭ to turn the page.\nReact with ⏹ to exit.");
      allEmbeds.push(em);
    }
    await createEmbedScrolling(message, allEmbeds);
  },
  getProfileEmbed(r, client) {
    let skin = "https://visage.surgeplay.com/full/256/" + r.id;
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(r.name)
      .setDescription("Profile:")
      .addField("UUID", r.id, true)
      .addField("Username", r.name, true)
      .setImage(skin)
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return Embed;
  },
  getServerEmbed(body, client, name) {
    const ip = body.ip;
    const port = body.port;
    const player = body.players.online + " / " + body.players.max;
    const version = body.version;
    const hostname = body.hostname;
    const desc = body.motd.clean.join("\n");
    const spaceRemoved = desc.replace(/ +(?= )/g, '');
    const Embed = new Discord.MessageEmbed()
      .setTitle(name)
      .setColor(color())
      .addField("IP", "`" + ip + "`", true)
      .addField("Port", "`" + port + "`", true)
      .addField("Player/Max", "`" + player + "`", true)
      .addField("Version", "`" + version + "`", true)
      .addField("Hostname", "`" + hostname + "`", true)
      .addField("Description", "`" + spaceRemoved + "`")
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return Embed;
  },
  async getHistoryEmbed(res, client) {
    const result = await nameHistory(res[0].id);
    var names = [];
    var num = 0
    for (var i = result.length - 1; i > -1; i--) {
      ++num;
      if (num === 1) names.push("**" + num + ". " + result[i].name + "**");
      else names.push(num + ". " + result[i].name);
    }
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(res[0].name + "'s Username History")
      .setDescription(names.join("\n"))
      .setFooter("Last changed on " + new Date(result[result.length - 1].changedToAt), client.user.displayAvatarURL());
    return Embed;
  }
};
