const { play } = require("./play.js");
const { updateQueue, getQueues } = require("../../helpers/music.js");
const { moveArray } = require("../../function.js");
const { ApplicationCommand, InteractionResponse, ApplicationCommandOption, ApplicationCommandOptionType } = require("../../classes/Slash.js");

module.exports = {
  name: "skip",
  description: "Skip a music in the queue.",
  usage: "[amount]",
  aliases: ["s"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "amount", "The amount of soundtrack to skip.")
  ]),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.sendMessage("Skipping soundtrack...");
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
    var skipped = 1;
    const guild = message.guild;
    if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to skip the music when the bot is playing!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue!");
    if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    if (serverQueue.repeating) skipped = 0;
    else if (args[0] && isNaN(parseInt(args[0]))) message.channel.send(`**${args[0]}** is not a integer. Will skip 1 track instead.`);
    else if (args[0]) skipped = parseInt(args[0]);
    for (var i = 0; i < skipped; i++) {
      if (serverQueue.looping) serverQueue.songs.push(serverQueue.songs[0]);
      serverQueue.songs.shift();
    }
    updateQueue(message.guild.id, serverQueue, message.pool);
    message.channel.send(`Skipped **${Math.max(1, skipped)}** track${skipped > 1 ? "s" : ""}!`);
    if (message.member.voice.channel && serverQueue.playing) {
      if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
      if (!serverQueue.random) play(guild, serverQueue.songs[0]);
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