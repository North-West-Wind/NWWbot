const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");
const { updateQueue, getQueues } = require("./main.js");

module.exports = {
  name: "pause",
  description: "Pause the current music.",
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to pause the music when the bot is playing!");
    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return InteractionResponse.sendMessage("There is nothing playing.");
    if (!serverQueue.paused) {
      serverQueue.paused = true;
      if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.pause(true);
      updateQueue(guild.id, serverQueue, client.pool);
      return InteractionResponse.sendMessage("The playback has been stopped.");
    } else {
      return InteractionResponse.sendMessage("The playback is already stopped.");
    }
  },
  music(message, serverQueue) {
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to pause the music when the bot is playing!");
    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return message.channel.send("There is nothing playing.");
    if (!serverQueue.paused) {
      serverQueue.paused = true;
      if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.pause(true);
      updateQueue(message.guild.id, serverQueue, message.pool);
      return message.channel.send("The playback has been stopped.");
    } else {
      return message.channel.send("The playback is already stopped.");
    }
  }
}