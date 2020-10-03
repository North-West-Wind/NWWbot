const arrayMove = require('array-move');
const { play } = require("./play.js")

module.exports = {
  name: "move",
  description: "Move a music to a specific position of the song queue.",
  usage: "<target> <destination>",
  category: 8,
  async music(message, serverQueue, queue, pool) {
    const args = message.content.split(/ +/);
    if (!args[1]) return message.channel.send("You did not provide any target." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    if (!args[2]) return message.channel.send("You did not provide any destination." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
    var queueIndex = parseInt(args[1]);
    var dest = parseInt(args[2]);
    if (isNaN(queueIndex))
      return message.channel.send("The target provided is not a number.");
    if (isNaN(dest))
      return message.channel.send("The destination provided is not a number.");
    if (!serverQueue) return message.channel.send("There is nothing playing.");
    var targetIndex = queueIndex - 1;
    var destIndex = dest - 1;
    if (targetIndex === 0 || destIndex === 0) {
      if (serverQueue.playing) {
        if (serverQueue.connection && serverQueue.connection.dispatcher) {
          serverQueue.connection.dispatcher.destroy();
        }
      }
    }
    if (targetIndex > serverQueue.songs.length - 1)
      return message.channel.send(
        `You cannot move the song that doesn't exist.`
      );
    var title = serverQueue.songs[targetIndex].title;
    arrayMove.mutate(serverQueue.songs, targetIndex, destIndex);
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
      `**${title}** has been moved from **#${queueIndex}** to **#${dest}**.`
    );
    if (targetIndex === 0 || destIndex === 0) {
      if (serverQueue.playing) {
        play(message.guild, serverQueue.songs[0], queue, pool);
      }
    }
  }
}