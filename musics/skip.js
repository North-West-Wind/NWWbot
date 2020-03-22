const { play } = require("./play.js")

module.exports = {
  name: "skip",
  description: "Skip a music in the song queue.",
  usage: " ",
  music(message, serverQueue, looping, queue, pool) {
    const guild = message.guild;
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  const guildLoopStatus = looping.get(message.guild.id);
    if(serverQueue.playing === false) return message.channel.send("No music is being played.")
  serverQueue.connection.dispatcher.destroy();
  if (
        guildLoopStatus === undefined ||
        guildLoopStatus === null ||
        !guildLoopStatus ||
        guildLoopStatus === false
      ) {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.shift();
    pool.getConnection(function(err, con) {
            con.query(
              "UPDATE servers SET queue = '" +
                escape(JSON.stringify(serverQueue.songs)) +
                "' WHERE id = " +
                guild.id,
              function(err, result) {
                if (err) return message.reply("there was an error trying to execute that command!");
                console.log("Updated song queue of " + guild.name);
              }
            );
            con.release();
          });
        play(guild, serverQueue.songs[0], looping, queue, pool);
      } else {
        console.log("Music ended! In " + guild.name);
        var song = serverQueue.songs[0];
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
        pool.getConnection(function(err, con) {
            con.query(
              "UPDATE servers SET queue = '" +
                escape(JSON.stringify(serverQueue.songs)) +
                "' WHERE id = " +
                guild.id,
              function(err, result) {
                if (err) return message.reply("there was an error trying to execute that command!");
                console.log("Updated song queue of " + guild.name);
              }
            );
            con.release();
          });
        play(guild, serverQueue.songs[0], looping, queue, pool);
      }
  message.channel.send("Skipped!");
  }
}