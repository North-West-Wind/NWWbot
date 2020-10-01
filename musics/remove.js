const { play } = require("./play.js");

module.exports = {
  name: "remove",
  description: "Remove soundtrack(s) from the song queue.",
  usage: "<index | starting index> [delete count]",
  async music(message, serverQueue, queue, pool) {
    const args = message.content.split(/ +/);
    if (!args[1]) return message.channel.send("You did not provide any index." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    if(args[2] && !isNaN(parseInt(args[2])) && parseInt(args[2]) < 1) return message.channel.send("The delete count must be larger than 0!");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
    var queueIndex = parseInt(args[1]);
    if (isNaN(queueIndex))
      return message.channel.send("The query provided is not a number.");
    if (!serverQueue) return message.channel.send("There is nothing playing.");
    var deleteIndex = queueIndex < 0 ? serverQueue.songs.length + queueIndex : queueIndex - 1;
    if (deleteIndex > serverQueue.songs.length - 1 || queueIndex === 0)
      return message.channel.send(
        `You cannot remove a soundtrack that doesn't exist.`
      );
    var song = serverQueue.songs[deleteIndex];
    var oldSong = serverQueue.songs[0];
    var title = song.title;
    var removed = await serverQueue.songs.splice(deleteIndex, args[2] && !isNaN(parseInt(args[2])) ? parseInt(args[2]) : 1);
    pool.getConnection(function (err, con) {
      if (err) return message.reply("there was an error trying to connect to the database!");
      con.query(
        "UPDATE servers SET queue = '" +
        escape(JSON.stringify(serverQueue.songs))
        +
        "' WHERE id = " +
        message.guild.id,
        function (err) {
          if (err) return message.reply("there was an error trying to update the queue!");
          console.log("Updated song queue of " + message.guild.name);
        }
      );
      con.release();
    });
    message.channel.send(
      `${removed.length > 1 ? `**${removed.length} tracks** have` : `**${title}** has`} been removed from the queue.`
    );
    if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
      if (serverQueue.connection && serverQueue.connection.dispatcher) {
        serverQueue.connection.dispatcher.destroy();
      }
      play(message.guild, serverQueue.songs[0], queue, pool);
    }
  }
}