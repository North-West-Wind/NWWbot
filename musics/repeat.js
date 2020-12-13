const { setQueue, updateQueue } = require("./main.js");

module.exports = {
  name: "repeat",
  description: "Toggle repeat of a song.",
  aliases: ["rep", "rp"],
  category: 8,
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    serverQueue.repeating = !serverQueue.repeating;
    if (serverQueue.repeating && serverQueue.looping) {
        serverQueue.looping = false;
        message.channel.send("Disabled looping to prevent conflict.");
    }
    try {
      await updateQueue(message, serverQueue, message.pool);
      if (serverQueue.repeating) await message.channel.send("The song queue is now being repeated.");
      else await message.channel.send("The song queue is no longer being repeated.");
    } catch (err) {
      await message.reply("there was an error trying to update the status!");
    }
  }
}