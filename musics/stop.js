const { ApplicationCommand, InteractionResponse } = require("../classes/Slash");
const { updateQueue, getQueues } = require("./main");

module.exports = {
  name: "stop",
  description: "Stop the music and disconnect the bot from the voice channel.",
  aliases: ["end", "disconnect", "dis"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue?.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to stop the music when the bot is playing!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    updateQueue(guild.id, serverQueue, null);
    if (guild.me.voice.channel) {
      await guild.me.voice.channel.leave();
      return InteractionResponse.sendMessage(":wave:");
    } else return InteractionResponse.sendMessage("Re-stopped");
  },
  async music(message, serverQueue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue?.playing) return await message.channel.send("You have to be in a voice channel to stop the music when the bot is playing!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    if (message.guild.me.voice.channel) {
      await message.guild.me.voice.channel.leave();
      await message.channel.send(":wave:");
    } else await message.channel.send("Re-stopped");
    updateQueue(message.guild.id, serverQueue, null);
  }
}