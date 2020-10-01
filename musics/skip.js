const { play } = require("./play.js");

module.exports = {
  name: "skip",
  description: "Skip a music in the queue.",
  usage: "[amount]",
  music(message, serverQueue, queue, pool) {
    const args = message.content.slice(message.client.prefix.length).split(/ +/);
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
      skipped = 0;
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
    pool.getConnection(function (err, con) {
      if (err) return message.reply("there was an error trying to connect to the database!");
      con.query(
        "UPDATE servers SET queue = '" +
        escape(JSON.stringify(serverQueue.songs)) +
        "' WHERE id = " +
        guild.id,
        function (err) {
          if (err) return message.reply("there was an error trying to update the queue!");
          console.log("Updated song queue of " + guild.name);
        }
      );
      con.release();
    });
    message.channel.send(`Skipped **${skipped}** track${skipped > 1 ? "s" : ""}!`);
    if(message.member.voice.channel && serverQueue.playing) {
      if(!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
      play(guild, serverQueue.songs[0], queue, pool);
    }
  }
}