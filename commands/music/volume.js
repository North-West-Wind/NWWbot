const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { updateQueue, getQueues } = require("../../helpers/music.js");

module.exports = {
  name: "volume",
  description: "Turn the volume of music up or down by percentage.",
  usage: "[percentage]",
  aliases: ["vol"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "percentage", "The percentage change of the volume."),
    new ApplicationCommandOption(ApplicationCommandOptionType.BOOLEAN.valueOf(), "nowplaying", "Whether or not to perform soundtrack-specific action.")
  ]),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.sendMessage("Setting volume...");
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
    if (!args[0]) return message.channel.send(`The current volume is **${Math.round(serverQueue.volume * 100)}%** and the current volume of the soundtrack is **${Math.round(serverQueue.volume * (serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.songs[0].volume : 1) * 100)}%**`);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to alter the volume when the bot is playing!");
    if (isNaN(Number(args[0]))) return message.channel.send("The percentage change you gave is no a number!");
    if (args[1] && args[1].toLowerCase() == "np") {
      if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue. You cannot change the volume of current soundtrack.");
      if (!isNaN(serverQueue.songs[0].volume)) serverQueue.songs[0].volume += Number(args[0]) / 100;
      else serverQueue.songs[0].volume = 1 + (Number(args[0]) / 100);
      if (serverQueue.songs[0].volume > 10) serverQueue.songs[0].volume = 10;
      if (serverQueue.songs[0].volume < 0) serverQueue.songs[0].volume = 0;
      message.channel.send("Volume of the current soundtrack has been changed to **" + (serverQueue.volume * serverQueue.songs[0].volume * 100) + "%**.");
    } else {
      serverQueue.volume += Number(args[0]) / 100;
      if (serverQueue.volume > 10) serverQueue.volume = 10;
      if (serverQueue.volume < 0) serverQueue.volume = 0;
      message.channel.send("Volume has been changed to **" + (serverQueue.volume * 100) + "%**.");
    }
    if (serverQueue.connection && serverQueue.playing && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.volume * serverQueue.songs[0].volume : serverQueue.volume);
    updateQueue(message.guild.id, serverQueue, null);
  }
}