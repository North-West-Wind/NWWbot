const { updateQueue } = require("./main.js");

module.exports = {
    name: "random",
    description: "Play the queue randomly.",
    aliases: ["rnd"],
    category: 8,
    async music(message, serverQueue) {
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
        serverQueue.random = !serverQueue.random;
        try {
          await updateQueue(message, serverQueue, message.pool);
          if (serverQueue.random) await message.channel.send("The queue will be played randomly.");
          else await message.channel.send("The queue will be played in order.");
        } catch (err) {
          await message.reply("there was an error trying to update the status!");
        }
    }
}