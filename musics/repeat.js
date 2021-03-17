const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");
const { setQueue, updateQueue, getQueues } = require("./main.js");

module.exports = {
  name: "repeat",
  description: "Toggle repeat of a soundtrack.",
  aliases: ["rep", "rp"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    serverQueue.repeating = !serverQueue.repeating;
    const lines = [];
    if (serverQueue.repeating && serverQueue.looping) {
      serverQueue.looping = false;
      lines.push("Disabled looping to prevent conflict.");
    }
    try {
      await updateQueue(guild.id, serverQueue, client.pool);
      if (serverQueue.repeating) lines.push("The queue is now being repeated.");
      else lines.push("The queue is no longer being repeated.");
      return InteractionResponse.sendMessage(lines.join("\n"));
    } catch (err) {
      return InteractionResponse.reply(author.id, "there was an error trying to update the status!");
    }
  },
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    serverQueue.repeating = !serverQueue.repeating;
    if (serverQueue.repeating && serverQueue.looping) {
      serverQueue.looping = false;
      message.channel.send("Disabled looping to prevent conflict.");
    }
    try {
      await updateQueue(message.guild.id, serverQueue, message.pool);
      if (serverQueue.repeating) await message.channel.send("The queue is now being repeated.");
      else await message.channel.send("The queue is no longer being repeated.");
    } catch (err) {
      await message.reply("there was an error trying to update the status!");
    }
  }
}