const { play, updateQueue } = require("./play.js");

module.exports = {
    name: "reverse",
    description: "Reverse the order of the server queue.",
    aliases: ["rev"],
    category: 8,
    async music(message, serverQueue, queue, pool) {
        if (!serverQueue) return message.channel.send("There is nothing playing.");
        if(serverQueue.songs.length < 1) return message.channel.send("Nothing is in the queue now.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
        var oldSong = serverQueue.songs[0];
        serverQueue.songs.reverse();
        message.channel.send("The queue has been reversed!");
        updateQueue(message, serverQueue, queue, pool);
        if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
          if (serverQueue.connection && serverQueue.connection.dispatcher) {
            serverQueue.connection.dispatcher.destroy();
          }
          play(message.guild, serverQueue.songs[0], queue, pool);
        }
    }
}