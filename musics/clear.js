const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");
const { updateQueue, setQueue, getQueues } = require("./main.js");
module.exports = {
  name: "clear",
  description: "Clear the queue and stop the playing soundtrack. Also resets the volume to 100%.",
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    var serverQueue = getQueues().get(interaction.guild_id);
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(interaction.guild_id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("The queue is already empty!");
    if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to clear the queue when the bot is playing!");
    if (serverQueue && serverQueue.connection != null && serverQueue.connection.dispatcher)
      serverQueue.connection.dispatcher.destroy();
    if (guild.me.voice.channel)
      guild.me.voice.channel.leave();
    updateQueue(interaction.guild_id, null, client.pool);
    return InteractionResponse.sendMessage("The queue has been cleared!");
  },
  async music(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("The queue is already empty!");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await message.channel.send("You have to be in a voice channel to clear the queue when the bot is playing!");
    if (serverQueue && serverQueue.connection != null && serverQueue.connection.dispatcher)
      serverQueue.connection.dispatcher.destroy();
    if (message.guild.me.voice.channel)
      message.guild.me.voice.channel.leave();
    updateQueue(message.guild.id, null, message.pool);
    message.channel.send("The queue has been cleared!");
  }
};
