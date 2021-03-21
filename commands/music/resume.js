const { InteractionResponse, ApplicationCommand } = require("../../classes/Slash.js");
const { updateQueue, getQueues } = require("../../helpers/music.js");

module.exports = {
  name: "resume",
  description: "Resume the paused music.",
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.ackknowledge();
  },
  async postSlash(client, interaction) {
    if (!interaction.guild_id) return;
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message);
  },
  async execute(message) {
    var serverQueue = getQueues().get(message.guild.id);
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to resume the music when the bot is playing!");
    if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return message.channel.send("There is nothing playing.");
    if (serverQueue.paused) {
      serverQueue.paused = false;
      if (serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.resume();
      updateQueue(message.guild.id, serverQueue, null);
      return await message.channel.send("The playback has been resumed.");
    } else {
      return await message.channel.send("The playback is not stopped.");
    }
  }
}