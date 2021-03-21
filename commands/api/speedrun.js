const Discord = require("discord.js");
const fetch = require("node-fetch").default;
const { createEmbedScrolling, color } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "speedrun",
  description: "Display speedrun attempts of a game from Speedrun.com.",
  aliases: ["sr"],
  usage: "<game>",
  category: 7,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "game", "The game of the speedrun.").setRequired(true)
  ]),
  async slash() {
    return InteractionResponse.sendMessage("Fetching speedruns...");
  },
  async postSlash(client, interaction, args) {
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    args = args?.map(x => x?.value).filter(x => !!x);
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args);
  },
  async execute(message, args) {
    const gameFetch = await fetch(`https://www.speedrun.com/api/v1/games/${escape(args.join(" "))}`).then(res => res.json());
    if (gameFetch.status && gameFetch.status === 404) {
      const games = [];
      const result = await fetch(`https://www.speedrun.com/api/v1/games?name=${escape(args.join(" "))}&_bulk=1`).then(res => res.json());
      for (var i = 0; i < (result.data.length > 10 ? 10 : result.data.length); i++) games.push(`${i + 1}. **${result.data[i].names.international}** : **${result.data[i].abbreviation}**`);
      const em = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Which game are you looking for?")
        .setDescription(games.join("\n"))
        .setTimestamp()
        .setFooter("Cannot find your game? Try to be more specified.", message.client.user.displayAvatarURL());
      if (result.data.length == 0) {
        return await message.channel.send("No game was found!");
      }
      if (result.data.length > 1) {
        var msg = await message.channel.send(em);
        var choices = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "⏹"];
        for (var i = 0; i < games.length; i++) await msg.react(choices[i]);
        await msg.react(choices[10]);
        const collected = await msg.awaitReactions((reaction, user) => choices.includes(reaction.emoji.name) && user.id === message.author.id, { max: 1, time: 30000 });
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        if (!collected) {
          em.setTitle("Timed Out").setDescription("Please try again.").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          return await msg.edit(em);
        }
        em.setTitle("Loading...").setDescription("This will take a while.").setTimestamp().setFooter("Please be patient.", message.client.user.displayAvatarURL());
        await msg.edit(em);
        const reaction = collected.first();
        if (reaction.emoji.name === choices[10]) {
          em.setTitle("Action Cancelled.").setDescription("").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          return await msg.edit(em);
        }
        var index = choices.indexOf(reaction.emoji.name);
        var id = result.data[index].id;
      } else {
        var msg = await message.channel.send(em);
        var index = 0;
        var id = result.data[0].id;
      }
    } else {
      var em = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Loading...")
        .setDescription("This will take a while.")
        .setTimestamp()
        .setFooter("Please be patient.", message.client.user.displayAvatarURL());
      var msg = await message.channel.send(em);
      var id = gameFetch.data.id;
    }
    const allEmbeds = [];
    const results = await fetch(`https://www.speedrun.com/api/v1/games/${id}/records`).then(res => res.json());
    for (const record of results.data) {
      if (record.level) var levelFetch = await fetch(`https://www.speedrun.com/api/v1/levels/${record.level}`).then(res => res.json());
      if (record.category) var categoryFetch = await fetch(`https://www.speedrun.com/api/v1/categories/${record.category}`).then(res => res.json());
      const level = levelFetch && levelFetch.data ? levelFetch.data.name : "N/A";
      const category = categoryFetch && categoryFetch.data ? categoryFetch.data.name : "N/A";
      const embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(results && results.data[0] ? results.data[index ? index : 0].names.international : gameFetch.data.names.international)
        .setDescription(`Category: **${category}**\nLevel: **${level}**`)
        .setURL(record.weblink ? record.weblink : undefined)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      for (const run of record.runs) {
        if (run.run.system.platform) var platformFetch = await fetch(`https://www.speedrun.com/api/v1/platforms/${run.run.system.platform}`).then(res => res.json());
        if (run.run.system.region) var regionFetch = await fetch(`https://www.speedrun.com/api/v1/regions/${run.run.system.region}`).then(res => res.json());
        const platform = platformFetch && platformFetch.data ? platformFetch.data.name : "N/A";
        const region = regionFetch && regionFetch.data ? regionFetch.data.name : "N/A"
        if (run.run.players[0].rel === "guest") var player = run.run.players[0].name;
        var time = run.run.times.primary_t;
        var date = run.run.date;
        var place = run.place;
        embed.addField(`Rank #${place}`, `Player: **${player}**\nTime: **${time}s**\nDate: **${date}**\nPlatform: **${platform}**\nRegion: **${region}**`);
      }
      allEmbeds.push(embed);
    }
    if (allEmbeds.length == 1) await msg.edit(allEmbeds[0]);
    else if (allEmbeds.length < 1) {
      em.setTitle(result && result.data[0] ? result.data[index ? index : 0].names.international : gameFetch.data.names.international).setDescription("No record was found for this game!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      await msg.edit(em);
    } else await createEmbedScrolling(message, allEmbeds);
  }
};
