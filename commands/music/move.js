const arrayMove = require('array-move');
const { play } = require("./play.js");
const { updateQueue, getQueues, setQueue } = require("../../helpers/music.js");
const { moveArray } = require("../../function");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require('../../classes/Slash.js');

module.exports = {
  name: "move",
  description: "Move a soundtrack to a specific position of the queue.",
  usage: "<target> <destination>",
  category: 8,
  args: 2,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "target", "The soundtrack to be moved.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "destination", "The new position of the soundtrack.").setRequired(true)
  ]),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.sendMessage("Accessing queue...");
  },
  async postSlash(client, interaction, args) {
    if (!interaction.guild_id) return;
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    args = args?.map(x => x?.value).filter(x => !!x)|| [];
    await this.execute(message, args);
  },
  async execute(message, args) {
    var serverQueue = getQueues().get(message.guild.id);
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the queue when the bot is playing!");
    var queueIndex = parseInt(args[0]);
    var dest = parseInt(args[1]);
    if (isNaN(queueIndex)) return message.channel.send("The target provided is not a number.");
    if (isNaN(dest)) return message.channel.send("The destination provided is not a number.");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return await message.channel.send("There is nothing in the queue.");
    var targetIndex = queueIndex - 1;
    var destIndex = dest - 1;
    if ((targetIndex === 0 || destIndex === 0) && serverQueue.playing && serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    if (targetIndex > serverQueue.songs.length - 1) return message.channel.send(`You cannot move a soundtrack that doesn't exist.`);
    var title = serverQueue.songs[targetIndex].title;
    arrayMove.mutate(serverQueue.songs, targetIndex, destIndex);
    updateQueue(message.guild.id, serverQueue, message.pool);
    message.channel.send(`**${title}** has been moved from **#${queueIndex}** to **#${dest}**.`);
    if ((targetIndex === 0 || destIndex === 0) && serverQueue.playing) {
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