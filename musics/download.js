const scdl = require("soundcloud-downloader");
const request = require("request-stream");
const ytdl = require("ytdl-core");
const {
    validURL,
    validYTURL,
    validSPURL,
    validGDURL,
    validYTPlaylistURL,
    validSCURL,
    validMSURL
} = require("../function.js");
const { addYTPlaylist, addYTURL, addSPURL, addSCURL, addMSURL, addPHURL, search } = require("./play.js");
const requestStream = url => {
    return new Promise((resolve, reject) => {
        request(url, (err, res) => err ? reject(err) : resolve(res));
    });
};
const Discord = require("discord.js");
module.exports = {
    name: "download",
    description: "Download the first soundtrack in the server queue.",
    usage: "[link | keywords]",
    aliases: ["dl"],
    category: 8,
    async music(message, serverQueue) {
        const args = message.content.split(/ +/);
        if (args[1]) return await this.downloadFromArgs(message, args);
        if (!serverQueue) return message.channel.send("There is nothing playing.");
        if (!serverQueue.songs) serverQueue.songs = [];
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the song queue.");
        let song = serverQueue.songs[0];
        await this.download(message, song);
    },
    async download(message, song) {
        try {
            if(song.isLive) {
              const args = ["0", song.url];
              const result = await addYTURL({ dummy: true }, args, song.type);
              if(result.error) throw "Failed to find video";
              if(!isEquivalent(result.songs[0], song)) {
                song = result.songs[0];
                serverQueue.songs[0] = song;
                updateQueue(message, serverQueue, queue, pool);
                if(song.isLive) return await message.channel.send("Livestream downloading is not supported and recommended! Come back later when the livestream is over.");
              }
            }
        } catch(err) {
            console.error(err);
            return await message.reply(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
        }
        let msg = await message.channel.send(`Downloading... (Soundtrack Type: **Type ${song.type}**)`);
        await message.channel.startTyping();
        let stream;
        switch (song.type) {
            case 2:
            case 4:
                try {
                    stream = await requestStream(song.url);
                } catch (err) {
                    await message.channel.stopTyping(true);
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            case 3:
                try {
                    stream = await scdl.download(song.url);
                } catch (err) {
                    await message.channel.stopTyping(true);
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            case 5:
                try {
                    const mp3 = await fetch(`https://north-utils.glitch.me/musescore/${encodeURIComponent(song.url)}`, { timeout: 30000 }).then(res => res.json());
                    if(mp3.error) throw new Error(mp3.message);
                    stream = await requestStream(mp3.url);
                } catch (err) {
                    await message.channel.stopTyping(true);
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            case 6:
                try {
                    stream = await requestStream(song.download);
                } catch (err) {
                    await message.channel.stopTyping(true);
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            default:
                try {
                    stream = ytdl(song.url, { highWaterMark: 1 << 25, filter: "audioonly", quality: "lowestaudio", dlChunkSize: 0, requestOptions: { headers: { cookie: process.env.COOKIE, 'x-youtube-identity-token': process.env.YT } } });
                } catch (err) {
                    await message.channel.stopTyping(true);
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
        }
        await msg.delete();
        try {
            await message.channel.send("The file may not appear just yet. Please be patient!");
            await message.channel.stopTyping(true);
            let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp3`);
            message.channel.send(attachment).catch((err) => message.reply(`there was an error trying to send the soundtrack! (${err.message})`));
        } catch (err) {
            message.reply(`there was an error trying to send the soundtrack!`);
            console.error(err);
        }
    },
    async downloadFromArgs(message, args) {
        var result = { error: true };
        await message.channel.startTyping();
        if (validYTPlaylistURL(args.slice(1).join(" "))) result = await addYTPlaylist(message, args);
        else if (validYTURL(args.slice(1).join(" "))) result = await addYTURL(message, args);
        else if (validSPURL(args.slice(1).join(" "))) result = await addSPURL(message, args);
        else if (validSCURL(args.slice(1).join(" "))) result = await addSCURL(message, args);
        else if (validGDURL(args.slice(1).join(" "))) return message.channel.send("Why should I download the file from a URL when you can access it?");
        else if (validMSURL(args.slice(1).join(" "))) result = await addMSURL(message, args);
        else if (validPHURL(args.slice(1).join(" "))) result = await addPHURL(message, args);
        else if (validURL(args.slice(1).join(" "))) return message.channel.send("Why should I download the file from a URL when you can access it?");
        else result = await search(message, args);
        if (result.error) return;
        if (Array.isArray(result.songs)) for (const song of result.songs) await this.download(message, song);
        else await this.download(message, result.song);
    }
}
