const scdl = require("soundcloud-downloader").default;
const ytdl = require("ytdl-core");
const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL, isEquivalent, requestStream } = require("../../function.js");
const { addYTPlaylist, addYTURL, addSPURL, addSCURL, addMSURL, addPHURL, search } = require("./play.js");
const { updateQueue, getQueues, setQueue } = require("../../helpers/music.js");
const Discord = require("discord.js");
const { getMP3 } = require("../api/musescore.js");
const requestYTDLStream = (url, opts) => {
    const timeoutMS = opts.timeout && !isNaN(parseInt(opts.timeout)) ? parseInt(opts.timeout) : 30000;
    const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`YTDL video download timeout after ${timeoutMS}ms`)), timeoutMS));
    const getStream = new Promise((resolve, reject) => {
        const stream = ytdl(url, opts);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([timeout, getStream]);
};
const sanitize = require("sanitize-filename");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
    name: "download",
    description: "Download the soundtrack from the server queue or online.",
    usage: "[index | link | keywords]",
    aliases: ["dl"],
    category: 8,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "Index/Link/Keywords of soundtrack.")
    ]),
    async slash(_client, interaction) {
        if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
        return InteractionResponse.sendMessage("Downloading soundtrack...");
    },
    async postSlash(client, interaction, args) {
        if (!interaction.guild_id) return;
        InteractionResponse.deleteMessage(client, interaction).catch(() => { });
        const message = await InteractionResponse.createFakeMessage(client, interaction);
        args = args?.map(x => x?.value).filter(x => !!x) || [];
        await this.execute(message, args);
    },
    async execute(message, args) {
        var serverQueue = getQueues().get(message.guild.id);
        if (args[0] && isNaN(parseInt(args[0]))) return await this.downloadFromArgs(message, serverQueue, args.join(" "));
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
        const index = parseInt(args[0]);
        var song = serverQueue.songs[0];
        if (!isNaN(index) && index <= serverQueue.songs.length && index > 0) song = serverQueue.songs[index - 1];
        await this.download(message, args, serverQueue, song);
    },
    async download(message, args, serverQueue, song) {
        try {
            if (song?.isLive) {
                const result = await addYTURL(song.url, song.type);
                if (result.error) throw "Failed to find video";
                if (!isEquivalent(result.songs[0], song)) {
                    song = result.songs[0];
                    serverQueue.songs[0] = song;
                    updateQueue(message.guild.id, serverQueue, message.pool);
                    if (song?.isLive) return await message.channel.send("Livestream downloading is not supported and recommended! Come back later when the livestream is over.");
                }
            }
        } catch (err) {
            NorthClient.storage.error(err);
            return await message.reply(`there was an error trying to download the soundtrack!`);
        }
        let msg = await message.channel.send(`Downloading... (Soundtrack Type: **Type ${song.type}**)`);
        message.channel.startTyping();
        let stream;
        try {
            switch (song.type) {
                case 2:
                case 4:
                    stream = await requestStream(song.url);
                    break;
                case 3:
                    stream = await scdl.download(song.url);
                    break;
                case 5:
                    const mp3 = await getMP3(song.url);
                    if (mp3.error) throw new Error(mp3.message);
                    if (mp3.url.startsWith("https://www.youtube.com/embed/")) stream = await requestYTDLStream(mp3.url, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                    else stream = await requestStream(mp3.url);
                    break;
                case 6:
                    stream = await requestStream(song.download);
                    if (stream.statusCode != 200) {
                        const g = await module.exports.addPHURL(message, args);
                        if (g.error) throw "Failed to find video";
                        song = g;
                        serverQueue.songs[0] = song;
                        updateQueue(message.guild.id, serverQueue, message.pool);
                        stream = await requestStream(song.download);
                        if (stream.statusCode != 200) throw new Error("Received HTTP Status Code: " + stream.statusCode);
                    }
                    break;
                default:
                    stream = await requestYTDLStream(song.url, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                    break;
            }
            if (stream.statusCode && stream.statusCode != 200) throw new Error("Received HTTP Status Code " + stream.statusCode);
        } catch (err) {
            message.channel.stopTyping(true);
            NorthClient.storage.error(err);
            return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
        }
        try {
            await msg.delete();
            await message.channel.send("The file may not appear just yet. Please be patient!");
            message.channel.stopTyping(true);
            let attachment = new Discord.MessageAttachment(stream, sanitize(`${song.title}.mp3`));
            await message.channel.send(attachment).catch((err) => message.reply(`there was an error trying to send the soundtrack! (${err.message})`));
        } catch (err) {
            message.reply(`there was an error trying to send the soundtrack!`);
            NorthClient.storage.error(err);
        }
    },
    async downloadFromArgs(message, serverQueue, link) {
        var result = { error: true };
        try {
            if (validYTPlaylistURL(link)) result = await addYTPlaylist(link);
            else if (validYTURL(link)) result = await addYTURL(link);
            else if (validSPURL(link)) result = await addSPURL(message, link);
            else if (validSCURL(link)) result = await addSCURL(link);
            else if (validGDURL(link)) return message.channel.send("Wait. You should be able to access this file?");
            else if (validMSURL(link)) result = await addMSURL(link);
            else if (validPHURL(link)) result = await addPHURL(link);
            else if (validURL(link)) return message.channel.send("Wait. You should be able to access this file?");
            else result = await search(message, link);
            if (result.error) return;
            if (result.msg) result.msg.delete({ timeout: 10000 });
            for (const song of result.songs) await this.download(message, serverQueue, song);
        } catch (err) {
            message.reply("there was an error trying to download the soundtack!");
            NorthClient.storage.error(err);
        }
    }
}
