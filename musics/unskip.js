const { play, updateQueue } = require("./play.js");

module.exports = {
    name: "unskip",
    description: "Go to the previous music in the queue.",
    usage: "[amount]",
    aliases: ["us"],
    category: 8,
    async music(message, serverQueue, queue) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        var skipped = 1;
        const guild = message.guild;
        if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to unskip the music when the bot is playing!");
        if (!serverQueue) return message.channel.send("There is no song that I could unskip!");
        if (!serverQueue.songs) serverQueue.songs = [];
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue!");
        if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        if (serverQueue.repeating) skipped = 0;
        else if (args[1] && isNaN(parseInt(args[1]))) message.channel.send(`**${args[1]}** is not a integer. Will skip 1 song instead.`);
        else if (args[1]) skipped = parseInt(args[1]);
        for (var i = 0; i < skipped; i++) {
            var song = serverQueue.songs.pop();
            serverQueue.songs.unshift(song);
        }
        updateQueue(message, serverQueue, queue);
        message.channel.send(`Unskipped **${Math.max(1, skipped)}** track${skipped > 1 ? "s" : ""}!`);
        if (message.member.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
            play(guild, serverQueue.songs[0], queue);
        }
    }
}