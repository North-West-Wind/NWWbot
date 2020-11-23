const { updateQueue } = require("./play");
const { setQueue } = require("./main.js");

module.exports = {
  name: "repeat",
  description: "Toggle repeat of a song.",
  aliases: ["rep", "rp"],
  category: 8,
  music(message, serverQueue, queue) {
    if(!serverQueue) {
      queue = setQueue(message.guild, [], false, false);
      serverQueue = queue.get(message.guild.id);
    }
    if (!serverQueue.repeating) {
      serverQueue.repeating = true;
      if (serverQueue.looping) {
        serverQueue.looping = false;
        message.channel.send("Disabled looping to prevent conflict.");
      }
      console.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET repeating = 1, looping = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song is now being repeated.");
        });
        con.release();
      });
    } else {
      serverQueue.repeating = false;
      console.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET repeating = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song is no longer being repeated.");
        });
        con.release();
      });
    }
    updateQueue(message, serverQueue, queue, 1);
  }
}