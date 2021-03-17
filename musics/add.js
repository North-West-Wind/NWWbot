const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL } = require("../function.js");
const { setQueue, updateQueue } = require("./main.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addPHURL, addURL, search, createEmbed } = require("./play.js");
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType } = require("../classes/Slash.js");

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    args: 1,
    slashInit: false,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The link of the soundtrack or the keywords to search for.").setRequired(true)
    ]),
    slash: async(client, interaction, args) => {
        try {
            var songs = [];
            var result = { error: true };
            if (validYTPlaylistURL(args[0].value)) result = await addYTPlaylist(args[0].value);
            else if (validYTURL(args[0].value)) result = await addYTURL(args[0].value);
            else if (validSPURL(args[0].value)) result = await addSPURL(message, args[0].value);
            else if (validSCURL(args[0].value)) result = await addSCURL(args[0].value);
            else if (validGDURL(args[0].value)) result = await addGDURL(args[0].value);
            else if (validMSURL(args[0].value)) result = await addMSURL(args[0].value);
            else if (validPHURL(args[0].value)) result = await addPHURL(args[0].value);
            else if (validURL(args[0].value)) result = await addURL(args[0].value);
            else result = await search(message, args[0].value);
            if (result.error) return;
            songs = result.songs;
            if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
            const Embed = createEmbed(message, songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false, message.pool);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(message, serverQueue, message.pool);
            if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
            else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
        } catch(err) {
            await message.reply("there was an error trying to add the soundtrack to the queue!");
            NorthClient.storage.error(err);
        }
    },
    async music(message, serverQueue) {
        try {
            var songs = [];
            var result = { error: true };
            if (validYTPlaylistURL(message.content)) result = await addYTPlaylist(message, message.content);
            else if (validYTURL(message.content)) result = await addYTURL(message, message.content);
            else if (validSPURL(message.content)) result = await addSPURL(message, message.content);
            else if (validSCURL(message.content)) result = await addSCURL(message, message.content);
            else if (validGDURL(message.content)) result = await addGDURL(message, message.content);
            else if (validMSURL(message.content)) result = await addMSURL(message, message.content);
            else if (validPHURL(message.content)) result = await addPHURL(message, message.content);
            else if (validURL(message.content)) result = await addURL(message, message.content);
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else result = await search(message, message.content);
            if (result.error) return;
            songs = result.songs;
            if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
            const Embed = createEmbed(message, songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false, message.pool);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(message, serverQueue, message.pool);
            if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
            else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
        } catch(err) {
            await message.reply("there was an error trying to add the soundtrack to the queue!");
            NorthClient.storage.error(err);
        }
    }
}