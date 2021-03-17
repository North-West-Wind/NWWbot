const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");
const { setQueue, updateQueue, getQueues } = require("./main.js");

module.exports = {
  name: "loop",
  description: "Toggle loop of the queue.",
  category: 8,
  aliases: ["lp"],
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  slash: async (client, interaction) => {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    var serverQueue = getQueues().get(interaction.guild_id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(interaction.guild_id, [], false, false, client.pool);
    serverQueue.looping = !serverQueue.looping;
    const lines = [];
    if (serverQueue.repeating && serverQueue.looping) {
      serverQueue.repeating = false;
      lines.push("Disabled repeating to prevent conflict.");
    }
    try {
      await updateQueue(interaction.guild_id, serverQueue, client.pool);
      if (serverQueue.looping) lines.push("The queue is now being looped.");
      else lines.push("The queue is no longer being looped.");
      return InteractionResponse.sendMessage(lines.join("\n"));
    } catch (err) {
      return InteractionResponse.reply(interaction.member.user.id, "there was an error trying to update the status!");
    }
  },
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    serverQueue.looping = !serverQueue.looping;
    if (serverQueue.repeating && serverQueue.looping) {
      serverQueue.repeating = false;
      message.channel.send("Disabled repeating to prevent conflict.");
    }
    try {
      await updateQueue(message.guild.id, serverQueue, message.pool);
      if (serverQueue.looping) await message.channel.send("The queue is now being looped.");
      else await message.channel.send("The queue is no longer being looped.");
    } catch (err) {
      await message.reply("there was an error trying to update the status!");
    }
  }
}