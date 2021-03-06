const { setQueue, updateQueue } = require("./main.js");

module.exports = {
  name: "loop",
  description: "Toggle loop of the queue.",
  category: 8,
  aliases: ["lp"],
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    serverQueue.looping = !serverQueue.looping;
    if (serverQueue.repeating && serverQueue.looping) {
        serverQueue.repeating = false;
        message.channel.send("Disabled repeating to prevent conflict.");
    }
    try {
      await updateQueue(message, serverQueue, message.pool);
      if (serverQueue.looping) await message.channel.send("The queue is now being looped.");
      else await message.channel.send("The queue is no longer being looped.");
    } catch (err) {
      await message.reply("there was an error trying to update the status!");
    }
  }
}