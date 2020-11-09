const scdl = require("soundcloud-downloader");
const ytdl = require("ytdl-core");
const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL, isEquivalent } = require("../function.js");
const { addYTPlaylist, addYTURL, addSPURL, addSCURL, addMSURL, addPHURL, search, updateQueue } = require("./play.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const Discord = require("discord.js");
const requestStream = (url) => new Promise((resolve, reject) => {
  const rs = require("request-stream");
  rs.get(url, {}, (err, res) => err ? reject(err) : resolve(res));
});
module.exports = {
    name: "download",
    description: "Download the soundtrack from the server queue or online.",
    usage: "[index | link | keywords]",
    aliases: ["dl"],
    category: 8,
    async music(message, serverQueue, queue, pool) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        if (args[1] && isNaN(parseInt(args[1]))) return await this.downloadFromArgs(message, serverQueue, queue, pool, args);
        if (!serverQueue) return message.channel.send("There is nothing playing.");
        if (!serverQueue.songs) serverQueue.songs = [];
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the song queue.");
        let song = serverQueue.songs[!(!isNaN(parseInt(args[1])) && parseInt(args[1]) > serverQueue.songs.length) ? 0 : parseInt(args[1])];
        await this.download(message, serverQueue, queue, pool, song);
    },
    async download(message, serverQueue, queue, pool, song) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        try {
            if (song.isLive) {
                const argss = ["0", song.url];
                const result = await addYTURL({ dummy: true }, argss, song.type);
                if (result.error) throw "Failed to find video";
                if (!isEquivalent(result.songs[0], song)) {
                    song = result.songs[0];
                    serverQueue.songs[0] = song;
                    updateQueue(message, serverQueue, queue, pool);
                    if (song.isLive) return await message.channel.send("Livestream downloading is not supported and recommended! Come back later when the livestream is over.");
                }
            }
        } catch (err) {
            console.error(err);
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
                    const mp3 = await fetch(`https://north-utils.glitch.me/musescore/${encodeURIComponent(song.url)}`, { timeout: 30000 }).then(res => res.json());
                    if (mp3.error) throw new Error(mp3.message);
                    stream = await requestStream(mp3.url);
                    break;
                case 6:
                    stream = await requestStream(song.download);
                    if(stream.statusCode != 200) {
                      const g = await module.exports.addPHURL(message, args);
                      if(g.error) throw "Failed to find video";
                      song = g;
                      serverQueue.songs[0] = song;
                      updateQueue(message, serverQueue, queue, pool);
                      stream = await requestStream(song.download);
                      if(stream.statusCode != 200) throw new Error("Received HTTP Status Code: " + stream.statusCode);
                    }
                    break;
                default:
                    stream = ytdl(song.url, { highWaterMark: 1 << 25, filter: "audioonly", quality: "lowestaudio", dlChunkSize: 0, requestOptions: { headers: { cookie: process.env.COOKIE, 'x-youtube-identity-token': process.env.YT } } });
                    break;
            }
            if(stream.statusCode && stream.statusCode != 200) throw new Error("Received HTTP Status Code " + stream.statusCode);
        } catch (err) {
            message.channel.stopTyping(true);
            console.error(err);
            return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
        }
        try {
            await msg.delete();
            await message.channel.send("The file may not appear just yet. Please be patient!");
            message.channel.stopTyping(true);
            let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp3`);
            await message.channel.send(attachment).catch((err) => message.reply(`there was an error trying to send the soundtrack! (${err.message})`));
        } catch (err) {
            message.reply(`there was an error trying to send the soundtrack!`);
            console.error(err);
        }
    },
    async downloadFromArgs(message, serverQueue, queue, pool, args) {
        var result = { error: true };
        try {
            if (validYTPlaylistURL(args.slice(1).join(" "))) result = await addYTPlaylist(message, args);
            else if (validYTURL(args.slice(1).join(" "))) result = await addYTURL(message, args);
            else if (validSPURL(args.slice(1).join(" "))) result = await addSPURL(message, args);
            else if (validSCURL(args.slice(1).join(" "))) result = await addSCURL(message, args);
            else if (validGDURL(args.slice(1).join(" "))) return message.channel.send("Wait. You should be able to access this file?");
            else if (validMSURL(args.slice(1).join(" "))) result = await addMSURL(message, args);
            else if (validPHURL(args.slice(1).join(" "))) result = await addPHURL(message, args);
            else if (validURL(args.slice(1).join(" "))) return message.channel.send("Wait. You should be able to access this file?");
            else result = await search(message, args);
            if (result.error) return;
            if (result.msg) result.msg.delete({ timeout: 10000 });
            for (const song of result.songs) await this.download(message, serverQueue, queue, pool, song);
        } catch(err) {
            message.reply("there was an error trying to download the soundtack!");
            console.error(err);
        }
    }
}
