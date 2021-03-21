const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL } = require("../../function.js");
const { setQueue, updateQueue, getQueues } = require("../../helpers/music.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addPHURL, addURL, search, createEmbed } = require("./play.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    args: 1,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "link", "The link of the soundtrack. (Use /search to search)").setRequired(true)
    ]),
    async slash(_client, interaction) {
      if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
      return InteractionResponse.sendMessage("Adding soundtrack...");
    },
    async postSlash(client, interaction, args) {
      if (!interaction.guild_id) return;
      InteractionResponse.deleteMessage(client, interaction).catch(() => { });
      const message = await InteractionResponse.createFakeMessage(client, interaction);
      args = args[0]?.value?.split(/ +/) || [];
      await this.execute(message, args);
    },
    async execute(message, args) {
        var serverQueue = getQueues().get(message.guild.id);
        try {
            var songs = [];
            var result = { error: true, message: "Unknown Error" };
            if (validYTPlaylistURL(args.join(" "))) result = await addYTPlaylist(args.join(" "));
            else if (validYTURL(args.join(" "))) result = await addYTURL(args.join(" "));
            else if (validSPURL(args.join(" "))) result = await addSPURL(message, args.join(" "));
            else if (validSCURL(args.join(" "))) result = await addSCURL(args.join(" "));
            else if (validGDURL(args.join(" "))) result = await addGDURL(args.join(" "));
            else if (validMSURL(args.join(" "))) result = await addMSURL(args.join(" "));
            else if (validPHURL(args.join(" "))) result = await addPHURL(args.join(" "));
            else if (validURL(args.join(" "))) result = await addURL(args.join(" "));
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else result = await search(message, args.join(" "));
            if (result.error) return await message.channel.send(result.message);
            songs = result.songs;
            if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
            const Embed = createEmbed(message.client, songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false, message.pool);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(message.guild.id, serverQueue, message.pool);
            if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
            else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
        } catch(err) {
            await message.reply("there was an error trying to add the soundtrack to the queue!");
            NorthClient.storage.error(err);
        }
    }
}