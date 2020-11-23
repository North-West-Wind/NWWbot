const { updateQueue } = require("./play");
const { setQueue } = require("./main.js");

module.exports = {
  name: "loop",
  description: "Toggle loop of the song queue.",
  category: 8,
  aliases: ["lp"],
  music(message, serverQueue, queue) {
    if(!serverQueue) {
      queue = setQueue(message.guild, [], false, false);
      serverQueue = queue.get(message.guild.id);
    }
    if (!serverQueue.looping) {
      serverQueue.looping = true;
      if (serverQueue.repeating) {
        serverQueue.repeating = false;
        message.channel.send("Disabled repeat to prevent conflict.");
      }
      console.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET looping = 1, repeating = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song queue is now being looped.");
        });
        
      });
    } else {
      serverQueue.looping = false;
      console.getConnection(function (err, con) {
        if (err) return message.reply("there was an error trying to connect to the database!");
        con.query("UPDATE servers SET looping = NULL WHERE id = '" + message.guild.id + "'", function (err) {
          if (err) return message.reply("there was an error trying to update the status!");
          message.channel.send("The song queue is no longer being looped.");
        });
        
      });
    }
    updateQueue(message, serverQueue, queue, 1);
  }
}