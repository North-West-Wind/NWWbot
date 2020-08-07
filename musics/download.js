const { music } = require("./main");

const Discord = require("discord.js");
module.exports = {
    name: "download",
    description: "Download the soundtrack that is currently playing on the server.",
    usage: " ",
    async music(message, serverQueue) {
        if(!serverQueue) return message.channel.send("There is nothing playing.");
        if(!serverQueue.songs) serverQueue.songs = [];
        if(serverQueue.songs.length < 1) return message.channel.send("There is nothing in the song queue.");
        let song = serverQueue.songs[0];
        let stream;
        switch(song.type) {
            case 2:
                stream = await requestStream(song.url);
                break;
            case 3:
                var res = await GET(`http://api.soundcloud.com/tracks/${song.id}/stream?client_id=${process.env.SCID}`);
                stream = await requestStream(res.responseUrl);
            default:
                stream = await ytdl(song.url, {
                  highWaterMark: 1 << 28, begin: begin, requestOptions: {
                    headers: {
                      cookie: process.env.COOKIE
                    }
                  }
                });
                break;
        }
        if(!stream) return message.reply("there was an error trying to download the soundtrack!");
        let attachment = new Discord.MessageAttachment(stream, `${song.title}.mp3`);
        message.channel.send("Download Finished", attachment);
    }
}