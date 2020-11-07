const { ms } = require("../function.js");
const { play } = require("./play.js");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

module.exports = {
    name: "seek",
    description: "Skip to the time specified for the current playing soundtrack.",
    usage: "<time>",
    aliases: ["skipto"],
    category: 8,
    async music(message, serverQueue, queue, pool) {
        if(!serverQueue) return message.channel.send("There is nothing playing.");
        if(serverQueue.songs.length < 1 || !serverQueue.connection || !serverQueue.connection.dispatcher || !serverQueue.playing) return message.channel.send("There is nothing in the queue.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to change the time of the soundtrack begins when the bot is playing!");
        if(serverQueue.songs[0].time === "∞") return message.channel.send("This command does not work for live videos.");
        const args = message.content.slice(message.prefix.length).split(/ +/);
        if(args.length < 2) return message.channel.send("You didn't provide the time to skip to!");
        const parsed = ms(args.slice(1).join(" "));
        if(!parsed) return message.channel.send("The given time is not valid!");
        if(Math.round(parsed / 1000) > Math.floor(ms(serverQueue.songs[0].time) / 1000)) return message.channel.send("The time specified should not be larger than the maximum length of the soudtrack!");
        serverQueue.connection.dispatcher.destroy();
        play(message.guild, serverQueue.songs[0], queue, pool, 0, Math.round(parsed / 1000));
        message.channel.send(`Seeked to **${moment.duration(Math.round(parsed / 1000), "seconds").format()}**`);
    }
}