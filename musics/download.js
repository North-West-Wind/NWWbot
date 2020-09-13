const ytdl = require("ytdl-core-discord");
const scdl = require("soundcloud-downloader");
const request = require("request-stream");

const requestStream = url => {
    return new Promise(resolve => {
        request(url, (err, res) => resolve(res));
    });
};
const GET = url => {
    return new Promise(resolve => {
        http.get(url, res => resolve(res));
    });
}
const Discord = require("discord.js");
module.exports = {
    name: "download",
    description: "Download the soundtrack that is currently playing on the server.",
    usage: " ",
    aliases: ["dl"],
    async music(message, serverQueue) {
        if (!serverQueue) return message.channel.send("There is nothing playing.");
        if (!serverQueue.songs) serverQueue.songs = [];
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the song queue.");
        let song = serverQueue.songs[0];
        let msg = await message.channel.send(`Downloading... (Soundtrack Type: **Type ${song.type}**)`);
        let stream;
        switch (song.type) {
            case 2:
                try {
                    stream = await requestStream(song.url);
                    let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp3`);
                } catch(err) {
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            case 3:
                try {
                    stream = await scdl.download(song.url);
                    let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp3`);
                } catch(err) {
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
            default:
                try {
                    stream = await ytdl(song.url, {
                        highWaterMark: 1 << 28, requestOptions: {
                            headers: {
                                cookie: process.env.COOKIE
                            }
                        }
                    });
                    let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp4`);
                } catch(err) {
                    console.error(err);
                    return await msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
                }
                break;
        }
        await msg.delete();
        try {
            message.channel.send(attachment);
        } catch(err) {
            message.channel.send(`<@${message.author.id}>, there was an error trying to send the soundtrack!`);
            console.error(err);
        }
    }
}
