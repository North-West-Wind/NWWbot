const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash");
const ytsr = require("ytsr");
const { NorthClient } = require("../classes/NorthClient");
const { decodeHtmlEntity, color, createEmbedScrolling } = require("../function");
const Discord = require("discord.js");
const scdl = require("soundcloud-downloader").default;

module.exports = {
    name: "search",
    description: "Search for soundtracks with given keywords.",
    usage: "<keywords>",
    category: 8,
    args: 1,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The keywords to search for.").setRequired(true)
    ]),
    slash: async(client, interaction, args) => {
        if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
        const link = args[0].value;

        const allEmbeds = [];
        const Embed = new Discord.MessageEmbed()
          .setTitle(`Search result of ${link} on YouTube`)
          .setColor(color())
          .setTimestamp()
          .setFooter("Please do so within 60 seconds.", client.user.displayAvatarURL());
        const results = [];
        try {
          const searched = await ytsr(link, { limit: 20 });
          var video = searched.items.map(x => {
            x.thumbnail = x.bestThumbnail?.url;
            x.live = !!x.live;
            return x;
          });
        } catch (err) {
          NorthClient.storage.error(err);
          return InteractionResponse.reply(interaction.member.user.id, "there was an error trying to search the videos!");
        }
        const ytResults = video.map(x => ({
          title: decodeHtmlEntity(x.title),
          url: x.url,
          type: 0,
          time: !x.live ? x.duration : "∞",
          thumbnail: x.thumbnail,
          volume: 1,
          isLive: x.live
        })).filter(x => !!x.url);
        var num = 0;
        if (ytResults.length > 0) {
          results.push(ytResults);
          Embed.setDescription(ytResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
          allEmbeds.push(Embed);
        }
        const scEm = new Discord.MessageEmbed()
          .setTitle(`Search result of ${link} on SoundCloud`)
          .setColor(color())
          .setTimestamp()
          .setFooter("Please do so within 60 seconds.", message.client.user.displayAvatarURL());
        try {
          var scSearched = await scdl.search({
            limit: 20,
            query: link,
            resourceType: "tracks"
          });
          num = 0;
        } catch (err) {
          NorthClient.storage.error(err);
          return InteractionResponse.reply(interaction.member.user.id, "there was an error trying to search the videos!");
        }
        const scResults = scSearched.collection.map(x => ({
          title: x.title,
          url: x.permalink_url,
          type: 3,
          time: moment.duration(Math.floor(x.duration / 1000), "seconds").format(),
          thumbnail: x.artwork_url,
          volume: 1,
          isLive: false
        })).filter(x => !!x.url);
        if (scResults.length > 0) {
          results.push(scResults);
          scEm.setDescription(scResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
          allEmbeds.push(scEm);
        }
        if (allEmbeds.length < 1) return InteractionResponse.sendMessage("Cannot find any result with the given string.");
        return InteractionResponse.sendEmbeds(...allEmbeds);
    },
    async execute(message) {
        const link = message.content.slice(message.prefix.length).split(/ +/).slice(1).join(" ");

        const allEmbeds = [];
        const Embed = new Discord.MessageEmbed()
          .setTitle(`Search result of ${link} on YouTube`)
          .setColor(color())
          .setTimestamp()
          .setFooter("Please do so within 60 seconds.", message.client.user.displayAvatarURL());
        const results = [];
        try {
          const searched = await ytsr(link, { limit: 20 });
          var video = searched.items.map(x => {
            x.thumbnail = x.bestThumbnail?.url;
            x.live = !!x.live;
            return x;
          });
        } catch (err) {
          NorthClient.storage.error(err);
          return await message.reply("there was an error trying to search the videos!");
        }
        const ytResults = video.map(x => ({
          title: decodeHtmlEntity(x.title),
          url: x.url,
          type: 0,
          time: !x.live ? x.duration : "∞",
          thumbnail: x.thumbnail,
          volume: 1,
          isLive: x.live
        })).filter(x => !!x.url);
        var num = 0;
        if (ytResults.length > 0) {
          results.push(ytResults);
          Embed.setDescription(ytResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
          allEmbeds.push(Embed);
        }
        const scEm = new Discord.MessageEmbed()
          .setTitle(`Search result of ${link} on SoundCloud`)
          .setColor(color())
          .setTimestamp()
          .setFooter("Please do so within 60 seconds.", message.client.user.displayAvatarURL());
        try {
          var scSearched = await scdl.search({
            limit: 20,
            query: link,
            resourceType: "tracks"
          });
          num = 0;
        } catch (err) {
          NorthClient.storage.error(err);
          return await message.reply("there was an error trying to search the videos!");
        }
        const scResults = scSearched.collection.map(x => ({
          title: x.title,
          url: x.permalink_url,
          type: 3,
          time: moment.duration(Math.floor(x.duration / 1000), "seconds").format(),
          thumbnail: x.artwork_url,
          volume: 1,
          isLive: false
        })).filter(x => !!x.url);
        if (scResults.length > 0) {
          results.push(scResults);
          scEm.setDescription(scResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
          allEmbeds.push(scEm);
        }
        if (allEmbeds.length < 1) return await message.channel.send("Cannot find any result with the given string.");
        await createEmbedScrolling(message, allEmbeds);
    }
}