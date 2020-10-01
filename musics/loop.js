module.exports = {
  name: "loop",
  description: "Toggle loop of the song queue.",
  usage: " ",
  aliases: ["lp"],
  music(message, serverQueue, queue, pool) {
    const guildLoopStatus = serverQueue.looping;
    const guildRepeatStatus = serverQueue.repeating;
    if (!guildLoopStatus) {
      serverQueue.looping = true;
      if (guildRepeatStatus === true) {
        serverQueue.repeating = false;
        message.channel.send("Disabled repeat to prevent conflict.");
      }
      pool.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET looping = 1, repeating = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song queue is now being looped.");
        });
        con.release();
      });
    } else {
      serverQueue.looping = false;
      pool.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET looping = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song queue is no longer being looped.");
        });
        con.release();
      });
      return;
    }
  }
}