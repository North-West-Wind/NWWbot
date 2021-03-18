const { play } = require("./play.js");
const { updateQueue, getQueues } = require("../../helpers/music.js");
const { moveArray } = require("../../function.js");
const { InteractionResponse, ApplicationCommand } = require("../../classes/Slash.js");

module.exports = {
  name: "reverse",
  description: "Reverse the order of the server queue.",
  aliases: ["rev"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("Nothing is in the queue now.");
    if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to alter the queue when the bot is playing!");
    var oldSong = serverQueue.songs[0];
    serverQueue.songs.reverse();
    updateQueue(guild.id, serverQueue, client.pool);
    if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
      if (serverQueue.connection && serverQueue.connection.dispatcher) {
        serverQueue.connection.dispatcher.destroy();
      }
      if (!serverQueue.random) play(guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(guild.id, serverQueue, serverQueue.pool);
        play(guild, pending);
      }
    }
    return InteractionResponse.sendMessage("The queue has been reversed!");
  },
  async execute(message) {
    var serverQueue = getQueues().get(message.guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("Nothing is in the queue now.");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
    var oldSong = serverQueue.songs[0];
    serverQueue.songs.reverse();
    message.channel.send("The queue has been reversed!");
    updateQueue(message.guild.id, serverQueue, message.pool);
    if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
      if (serverQueue.connection && serverQueue.connection.dispatcher) {
        serverQueue.connection.dispatcher.destroy();
      }
      if (!serverQueue.random) play(message.guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(message.guild.id, serverQueue, serverQueue.pool);
        play(message.guild, pending);
      }
    }
  }
}