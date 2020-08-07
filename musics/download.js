const ytdl = require("ytdl-core-discord");

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
        let msg = await message.channel.send("Downloading...");
        let song = serverQueue.songs[0];
        let stream;
        switch (song.type) {
            case 2:
                stream = await requestStream(song.url);
                break;
            case 3:
                var res = await GET(`http://api.soundcloud.com/tracks/${song.id}/stream?client_id=${process.env.SCID}`);
                stream = await requestStream(res.responseUrl);
            default:
                stream = await ytdl(song.url, {
                    highWaterMark: 1 << 28, requestOptions: {
                        headers: {
                            cookie: process.env.COOKIE
                        }
                    }
                });
                break;
        }
        let bufs = [];
        stream.on("data", d => {
            bufs.push(d);
        });
        stream.on("error", err => {
            console.error(err);
            msg.edit(`<@${message.author.id}>, there was an error trying to download the soundtrack!`);
        });
        stream.on("end", () => {
            let buf = Buffer.concat(bufs);
            let attachment = new Discord.MessageAttachment(buf, `${song.title}.mp3`);
            try {
                msg.edit("Download Finished", attachment);
            } catch(err) {
                msg.edit(`<@${message.author.id}>, there was an error trying to send the soundtrack!`);
            }
        });
    }
}