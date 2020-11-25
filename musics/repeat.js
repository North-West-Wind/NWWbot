const { updateQueue } = require("./play");
const { setQueue } = require("./main.js");

module.exports = {
  name: "repeat",
  description: "Toggle repeat of a song.",
  aliases: ["rep", "rp"],
  category: 8,
  async music(message, serverQueue, queue) {
    if(!serverQueue) {
      queue = setQueue(message.guild, [], false, false, message.pool);
      serverQueue = queue.get(message.guild.id);
    }
    if (!serverQueue.repeating) {
      serverQueue.repeating = true;
      if (serverQueue.looping) {
        serverQueue.looping = false;
        message.channel.send("Disabled looping to prevent conflict.");
      }
      try {
        await message.pool.query(`UPDATE servers SET repeating = 1, looping = NULL WHERE id = '${message.guild.id}'`);
        await message.channel.send("The song queue is now being repeated.");
      } catch(err) {
        console.error(err);
        await message.reply("there was an error trying to update the status!");
      }
    } else {
      serverQueue.repeating = false;
      try {
        await message.pool.query(`UPDATE servers SET repeating = NULL WHERE id = '${message.guild.id}'`);
        await message.channel.send("The song queue is no longer being repeated.");
      } catch(err) {
        console.error(err);
        await message.reply("there was an error trying to update the status!");
      }
    }
    updateQueue(message, serverQueue, queue, 1);
  }
}