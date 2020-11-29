const { null } = require("mathjs");
const { play, updateQueue } = require("./play.js");

module.exports = {
  name: "migrate",
  description: "Move the bot to the channel you are in. Use when changing voice channel.",
  category: 8,
  async music(message, serverQueue, queue) {
    const exit = console.exit;
    const migrating = console.migrating;
    if (migrating.find(x => x === message.guild.id)) return message.channel.send("I'm on my way!").then(msg => msg.delete(10000));
    if (!message.member.voice.channel) return message.channel.send("You are not in any voice channel!");
    if (!message.guild.me.voice.channel) return message.channel.send("I am not in any voice channel!");
    if (message.member.voice.channelID === message.guild.me.voice.channelID) return message.channel.send("I'm already in the same channel with you!");
    if (!serverQueue) return message.channel.send("There is nothing playing.");
    if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    if (!serverQueue.playing) return message.channel.send("I'm not playing anything.");
    if (!message.member.voice.channel.permissionsFor(message.guild.me).has(3145728)) return message.channel.send("I don't have the required permissions to play music here!");
    migrating.push(message.guild.id);
    if (exit.find(x => x === message.guild.id)) exit.splice(exit.indexOf(message.guild.id), 1);
    const oldChannel = serverQueue.voiceChannel;
    var seek = 0;
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
      seek = Math.floor((serverQueue.connection.dispatcher.streamTime - serverQueue.startTime) / 1000);
      serverQueue.connection.dispatcher.destroy();
    }
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
    const voiceChannel = message.member.voice.channel;
    const msg = await message.channel.send("Migrating in 3 seconds...");
    setTimeout(async () => {
      if (!message.guild.me.voice.channel || message.guild.me.voice.channelID !== voiceChannel.id) serverQueue.connection = await voiceChannel.join();
      else serverQueue.connection = message.guild.me.voice.connection;
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = message.channel;
      await msg.edit(`Moved from **${oldChannel.name}** to **${voiceChannel.name}**`).catch(() => {});
      migrating.splice(migrating.indexOf(message.guild.id));
      updateQueue(message, serverQueue, queue, null);
      play(message.guild, serverQueue.songs[0], queue, 0, seek);
    }, 3000);
  }
}