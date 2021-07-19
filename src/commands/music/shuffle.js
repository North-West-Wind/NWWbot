const { InteractionResponse, ApplicationCommand } = require("../../classes/Slash.js");
const { shuffleArray } = require("../../function.js");
const { updateQueue, getQueues, setQueue } = require("../../helpers/music.js");
module.exports = {
  name: "shuffle",
  description: "Shuffle the queue.",
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.sendMessage("Shuffling queue...");
  },
  async postSlash(client, interaction) {
    if (!interaction.guild_id) return;
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message);
  },
  async execute(message) {
    var serverQueue = getQueues().get(message.guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (!serverQueue || serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to shuffle the queue when the bot is playing!");
    if(serverQueue.playing) await shuffleArray(serverQueue.songs, 1);
    else await shuffleArray(serverQueue.songs, 0);
    updateQueue(message.guild.id, serverQueue, message.pool);
    message.channel.send("Song queue has been shuffled.");
  }
};
