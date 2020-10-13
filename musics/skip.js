const { play, updateQueue } = require("./play.js");

module.exports = {
  name: "skip",
  description: "Skip a music in the queue.",
  usage: "[amount]",
  category: 8,
  async music(message, serverQueue, queue, pool) {
    const args = message.content.split(/ +/);
    var skipped = 1;
    const guild = message.guild;
    if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing)
      return message.channel.send(
        "You have to be in a voice channel to skip the music when the bot is playing!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    const guildLoopStatus = serverQueue.looping;
    const guildRepeatStatus = serverQueue.repeating;
    if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    if (guildRepeatStatus) {
      skipped = 1;
    } else if (guildLoopStatus) {
      if (args[1]) {
        if (isNaN(parseInt(args[1]))) {
          message.channel.send(`**${args[1]}** is not a integer. Will skip 1 song instead.`);
          var song = serverQueue.songs[0];
          serverQueue.songs.push(song);
          serverQueue.songs.shift();
        } else {
          skipped = parseInt(args[1]);
          for (var i = 0; i < parseInt(args[1]); i++) {
            var song = serverQueue.songs[0];
            serverQueue.songs.push(song);
            serverQueue.songs.shift();
          }
        }
      } else {
        var song = serverQueue.songs[0];
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
      }
    } else {
      if (args[1]) {
        if (isNaN(parseInt(args[1]))) {
          message.channel.send(`**${args[1]}** is not a integer. Will skip 1 song instead.`);
          serverQueue.songs.shift();
        } else {
          skipped = parseInt(args[1]);
          for (var i = 0; i < parseInt(args[1]); i++) {
            serverQueue.songs.shift();
          }
        }
      } else {
        serverQueue.songs.shift();
      }
    }
    updateQueue(message, serverQueue, queue, pool);
    message.channel.send(`Skipped **${skipped}** track${skipped > 1 ? "s" : ""}!`);
    if(message.member.voice.channel && serverQueue.playing) {
      if(!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
      play(guild, serverQueue.songs[0], queue, pool);
    }
  }
}