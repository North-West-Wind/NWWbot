const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL } = require("../function.js");
const { setQueue, updateQueue } = require("./main.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addPHURL, addURL, search, createEmbed } = require("./play.js");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    args: 1,
    async music(message, serverQueue) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        try {
            var songs = [];
            var result = { error: true };
            if (validYTPlaylistURL(args.slice(1).join(" "))) result = await addYTPlaylist(message, args);
            else if (validYTURL(args.slice(1).join(" "))) result = await addYTURL(message, args);
            else if (validSPURL(args.slice(1).join(" "))) result = await addSPURL(message, args);
            else if (validSCURL(args.slice(1).join(" "))) result = await addSCURL(message, args);
            else if (validGDURL(args.slice(1).join(" "))) result = await addGDURL(message, args);
            else if (validMSURL(args.slice(1).join(" "))) result = await addMSURL(message, args);
            else if (validPHURL(args.slice(1).join(" "))) result = await addPHURL(message, args);
            else if (validURL(args.slice(1).join(" "))) result = await addURL(message, args);
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else result = await search(message, args);
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
            message.reply("there was an error trying to add the soundtrack to the queue!");
            NorthClient.storage.error(err);
        }
    }
}