module.exports = {
  name: "repeat",
  description: "Toggle repeat of a song.",
  usage: " ",
  aliases: ["rep", "rp"],
  music(message, serverQueue, looping, queue, pool, repeat) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  const guildLoopStatus = looping.get(message.guild.id);
  const guildRepeatStatus = repeat.get(message.guild.id);
  if (guildRepeatStatus === undefined || guildRepeatStatus === null || !guildRepeatStatus) {
    repeat.set(message.guild.id, true);
    if(guildLoopStatus === true) {
      looping.set(message.guild.id, false);
      message.channel.send("Disabled looping to prevent conflict.");
    }
    message.channel.send("The song is now being repeated.");
    
  } else {
    if (guildRepeatStatus === false) {
      repeat.set(message.guild.id, true);
      repeat.set(message.guild.id, true);
      if(guildLoopStatus === true) {
        looping.set(message.guild.id, false);
        message.channel.send("Disabled looping to prevent conflict.");
      }
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET repeating = 1 WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song is now being repeated.");
        });
        con.release();
      });
      return;
    } else {
      repeat.set(message.guild.id, false);
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET repeating = null WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song is no longer being repeated.");
        });
        con.release();
      });
      return;
    }
  }
  }
}