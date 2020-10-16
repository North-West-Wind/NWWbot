const { updateQueue } = require("./play");

module.exports = {
  name: "repeat",
  description: "Toggle repeat of a song.",
  aliases: ["rep", "rp"],
  category: 8,
  music(message, serverQueue, queue, pool) {
    const guildLoopStatus = serverQueue.looping;
    const guildRepeatStatus = serverQueue.repeating;
    if (!guildRepeatStatus) {
      serverQueue.repeating = true;
      if (guildLoopStatus) {
        serverQueue.looping = false;
        message.channel.send("Disabled looping to prevent conflict.");
      }
      pool.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET repeating = 1, looping = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song is now being repeated.");
        });
        con.release();
      });
    } else {
      serverQueue.repeating = false;
      pool.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET repeating = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song is no longer being repeated.");
        });
        con.release();
      });
    }
    updateQueue(message, serverQueue, queue, null);
  }
}