const { play } = require("./play.js")

module.exports = {
  name: "skip",
  description: "Skip a song in the queue.",
  music(message, serverQueue, looping, queue) {
    const guild = message.guild;
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  const guildLoopStatus = looping.get(message.guild.id);
  serverQueue.connection.dispatcher.destroy();
  if (
        guildLoopStatus === undefined ||
        guildLoopStatus === null ||
        !guildLoopStatus ||
        guildLoopStatus === false
      ) {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0], looping, queue);
      } else {
        console.log("Music ended! In " + guild.name);
        var song = serverQueue.songs[0];
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
        
        play(guild, serverQueue.songs[0], looping, queue);
      }
  message.channel.send("Skipped!");
  }
}