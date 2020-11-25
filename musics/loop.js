const { updateQueue } = require("./play");
const { setQueue } = require("./main.js");

module.exports = {
  name: "loop",
  description: "Toggle loop of the song queue.",
  category: 8,
  aliases: ["lp"],
  async music(message, serverQueue, queue) {
    if(!serverQueue) {
      queue = setQueue(message.guild, [], false, false, message.pool);
      serverQueue = queue.get(message.guild.id);
    }
    if (!serverQueue.looping) {
      serverQueue.looping = true;
      if (serverQueue.repeating) {
        serverQueue.repeating = false;
        message.channel.send("Disabled repeat to prevent conflict.");
      }
      try {
        await message.pool.query(`UPDATE servers SET looping = 1, repeating = NULL WHERE id = '${message.guild.id}'`);
        await message.channel.send("The song queue is now being looped.");
      } catch(err) {
        console.error(err);
        await message.reply("there was an error trying to update the status!");
      }
    } else {
      serverQueue.looping = false;
      try {
        await message.pool.query(`UPDATE servers SET looping = NULL WHERE id = '${message.guild.id}'`);
        await message.channel.send("The song queue is no longer being looped.");
      } catch(err) {
        console.error(err);
        await message.reply("there was an error trying to update the status!");
      }
    }
    updateQueue(message, serverQueue, queue, 1);
  }
}