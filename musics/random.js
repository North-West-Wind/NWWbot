const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");
const { updateQueue, getQueues } = require("./main.js");

module.exports = {
  name: "random",
  description: "Play the queue randomly.",
  aliases: ["rnd"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    serverQueue.random = !serverQueue.random;
    try {
      await updateQueue(guild.id, serverQueue, client.pool);
      if (serverQueue.random) return InteractionResponse.sendMessage("The queue will be played randomly.");
      else return InteractionResponse.sendMessage("The queue will be played in order.");
    } catch (err) {
      return InteractionResponse.reply(author.id, "there was an error trying to update the status!");
    }
  },
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    serverQueue.random = !serverQueue.random;
    try {
      await updateQueue(message.guild.id, serverQueue, message.pool);
      if (serverQueue.random) await message.channel.send("The queue will be played randomly.");
      else await message.channel.send("The queue will be played in order.");
    } catch (err) {
      await message.reply("there was an error trying to update the status!");
    }
  }
}