const { play, updateQueue } = require("./play.js");

module.exports = {
    name: "unskip",
    description: "Go to the previous music in the queue.",
    usage: "[amount]",
    category: 8,
    async music(message, serverQueue, queue, pool) {
        const args = message.content.split(/ +/);
        var skipped = 1;
        const guild = message.guild;
        if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing)
            return message.channel.send(
                "You have to be in a voice channel to unskip the music when the bot is playing!"
            );
        if (!serverQueue)
            return message.channel.send("There is no song that I could unskip!");
        const guildRepeatStatus = serverQueue.repeating;
        if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        if (guildRepeatStatus) {
            skipped = 1;
        } else {
            if (args[1]) {
                if (isNaN(parseInt(args[1]))) {
                    message.channel.send(`**${args[1]}** is not a integer. Will skip 1 song instead.`);
                    var song = serverQueue.songs.pop();
                    serverQueue.songs.unshift(song);
                } else {
                    skipped = parseInt(args[1]);
                    for (var i = 0; i < parseInt(args[1]); i++) {
                        var song = serverQueue.songs.pop();
                        serverQueue.songs.unshift(song);
                    }
                }
            } else {
                var song = serverQueue.songs.pop();
                serverQueue.songs.unshift(song);
            }
        }
        updateQueue(message, serverQueue, queue, pool);
        message.channel.send(`Unskipped **${skipped}** track${skipped > 1 ? "s" : ""}!`);
        if (message.member.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
            play(guild, serverQueue.songs[0], queue, pool);
        }
    }
}