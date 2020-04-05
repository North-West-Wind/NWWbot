module.exports = {
  name: "loop",
  description: "Toggle loop of the song queue.",
  usage: " ",
  aliases: ["lp"],
  music(message, serverQueue, looping, queue, pool, repeat) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  const guildLoopStatus = looping.get(message.guild.id);
  const guildRepeatStatus = repeat.get(message.guild.id);
  if (guildLoopStatus === undefined || guildLoopStatus === null || !guildLoopStatus) {
    looping.set(message.guild.id, true);
    if(guildRepeatStatus === true) {
      repeat.set(message.guild.id, false);
      message.channel.send("Disabled repeat to prevent conflict.");
    }
    message.channel.send("The song queue is now being looped.");
    
  } else {
    if (guildLoopStatus === false) {
      looping.set(message.guild.id, true)
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET looping = 1 WHERE id = '" + message.guild.id + "'", function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song queue is now being looped.");
        });
        con.release();
      });
      return;
    } else {
      looping.set(message.guild.id, false);
      if(guildRepeatStatus === true) {
        repeat.set(message.guild.id, false);
        message.channel.send("Disabled repeat to prevent conflict.");
      }
      pool.getConnection(function(err, con) {
        if(err) return message.reply("there was an error trying to execute that command!");
        con.query("UPDATE servers SET looping = null WHERE id = '" + message.guild.id + "'", function(err) {
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