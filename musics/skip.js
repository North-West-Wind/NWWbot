const { play } = require("./play.js");
const { updateQueue } = require("./main.js");
const { moveArray } = require("../function.js");

module.exports = {
  name: "skip",
  description: "Skip a music in the queue.",
  usage: "[amount]",
  aliases: ["s"],
  category: 8,
  async music(message, serverQueue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    var skipped = 1;
    const guild = message.guild;
    if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to skip the music when the bot is playing!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue!");
    if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
    if (serverQueue.repeating) skipped = 0;
    else if (args[1] && isNaN(parseInt(args[1]))) message.channel.send(`**${args[1]}** is not a integer. Will skip 1 track instead.`);
    else if (args[1]) skipped = parseInt(args[1]);
    for (var i = 0; i < skipped; i++) {
      if (serverQueue.looping) serverQueue.songs.push(serverQueue.songs[0]);
      serverQueue.songs.shift();
    }
    updateQueue(message, serverQueue, message.pool);
    message.channel.send(`Skipped **${Math.max(1, skipped)}** track${skipped > 1 ? "s" : ""}!`);
    if (message.member.voice.channel && serverQueue.playing) {
      if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
      if (!serverQueue.random) play(guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(message, serverQueue, serverQueue.pool);
        play(guild, serverQueue.songs[int]);
      }
    }
  }
}