const { play } = require("./play.js");
const { updateQueue, getQueues } = require("./main.js");
const { moveArray } = require("../function.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash.js");

module.exports = {
  name: "remove",
  description: "Remove soundtrack(s) from the queue.",
  usage: "<index | starting index> [delete count]",
  category: 8,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "index", "The index of the soundtrack to be removed.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "count", "The amount of soundtrack to delete after the index.")
  ]),
  slash: async(client, interaction, args) => {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);
    if (args[0].options[0]?.value && !isNaN(parseInt(args[0].options[0]?.value)) && parseInt(args[0].options[0]?.value) < 1) return InteractionResponse.sendMessage("The delete count must be larger than 0!");
    if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to alter the queue when the bot is playing!");
    var queueIndex = parseInt(args[0].value);
    if (isNaN(queueIndex)) return InteractionResponse.sendMessage("The query provided is not a number.");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("There is nothing in the queue.");
    var deleteIndex = queueIndex < 0 ? serverQueue.songs.length + queueIndex : queueIndex - 1;
    if (deleteIndex > serverQueue.songs.length - 1 || queueIndex === 0) return InteractionResponse.sendMessage(`You cannot remove a soundtrack that doesn't exist.`);
    var song = serverQueue.songs[deleteIndex];
    var oldSong = serverQueue.songs[0];
    var title = song.title;
    var removed = await serverQueue.songs.splice(deleteIndex, args[0].options[0]?.value && !isNaN(parseInt(args[0].options[0]?.value)) ? parseInt(args[0].options[0]?.value) : 1);
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
    return InteractionResponse.sendMessage(`${removed.length > 1 ? `**${removed.length} tracks** have` : `**${title}** has`} been removed from the queue.`);
  },
  async music(message, serverQueue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    if (args[2] && !isNaN(parseInt(args[2])) && parseInt(args[2]) < 1) return message.channel.send("The delete count must be larger than 0!");
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
    var queueIndex = parseInt(args[1]);
    if (isNaN(queueIndex)) return message.channel.send("The query provided is not a number.");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return await message.channel.send("There is nothing in the queue.");
    var deleteIndex = queueIndex < 0 ? serverQueue.songs.length + queueIndex : queueIndex - 1;
    if (deleteIndex > serverQueue.songs.length - 1 || queueIndex === 0) return message.channel.send(`You cannot remove a soundtrack that doesn't exist.`);
    var song = serverQueue.songs[deleteIndex];
    var oldSong = serverQueue.songs[0];
    var title = song.title;
    var removed = await serverQueue.songs.splice(deleteIndex, args[2] && !isNaN(parseInt(args[2])) ? parseInt(args[2]) : 1);
    updateQueue(message.guild.id, serverQueue, message.pool);
    await message.channel.send(`${removed.length > 1 ? `**${removed.length} tracks** have` : `**${title}** has`} been removed from the queue.`);
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