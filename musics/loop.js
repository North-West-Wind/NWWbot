module.exports = {
  name: "loop",
  description: "Toggle loop of the song queue.",
  usage: " ",
  aliases: ["lp"],
  music(message, serverQueue, looping, queue, pool, repeat) {
  const guildLoopStatus = looping.get(message.guild.id);
  const guildRepeatStatus = repeat.get(message.guild.id);
  if (guildLoopStatus === undefined || guildLoopStatus === null || !guildLoopStatus) {
    looping.set(message.guild.id, true);
    if(guildRepeatStatus === true) {
      repeat.set(message.guild.id, false);
      message.channel.send("Disabled repeat to prevent conflict.");
    }
    pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET looping = 1, repeating = NULL WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song queue is now being looped.");
        });
        con.release();
      });
  } else {
    if (guildLoopStatus === false) {
      looping.set(message.guild.id, true);
      if(guildRepeatStatus === true) {
        repeat.set(message.guild.id, false);
        message.channel.send("Disabled repeat to prevent conflict.");
      }
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET looping = 1, repeating = NULL WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song queue is now being looped.");
        });
        con.release();
      });
      return;
    } else {
      looping.set(message.guild.id, false);
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET looping = NULL WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song queue is no longer being looped.");
        });
        con.release();
      });
      return;
    }
  }
  }
}