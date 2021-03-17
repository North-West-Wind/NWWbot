const { updateQueue, getQueues } = require("./main.js");
const { moveArray } = require("../function");
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, InteractionResponse } = require("../classes/Slash.js");

module.exports = {
  name: "migrate",
  description: "Move the bot to the channel you are in. Use when changing voice channel.",
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  slash: async(client, interaction) => {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const exit = NorthClient.storage.guilds[interaction.guild_id].exit;
    const migrating = NorthClient.storage.migrating;
    if (migrating.find(x => x === interaction.guild_id)) {
      setTimeout(async() => {
        await client.api.webhooks(client.user.id, interaction.token).message["@original"].delete();
      }, 10000);
      return InteractionResponse.sendMessage("I'm on my way!");
    }
    var serverQueue = getQueues().get(interaction.guild_id);
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.voice.channel) return InteractionResponse.sendMessage("You are not in any voice channel!");
    if (!guild.me.voice.channel) return InteractionResponse.sendMessage("I am not in any voice channel!");
    if (author.voice.channelID === guild.me.voice.channelID) return InteractionResponse.sendMessage("I'm already in the same channel with you!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(interaction.guild_id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("There is nothing in the queue.");
    if (!serverQueue.playing) return InteractionResponse.sendMessage("I'm not playing anything.");
    if (!author.voice.channel.permissionsFor(guild.me).has(3145728)) return InteractionResponse.sendMessage("I don't have the required permissions to play music here!");
    migrating.push(interaction.guild_id);
    if (exit) NorthClient.storage.guilds[guild.id].exit = false;
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
    if (guild.me.voice.channel) await guild.me.voice.channel.leave();
    const voiceChannel = author.voice.channel;
    setTimeout(async () => {
      if (!guild.me.voice.channel || guild.me.voice.channelID !== voiceChannel.id) serverQueue.connection = await voiceChannel.join();
      else serverQueue.connection = guild.me.voice.connection;
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = await client.channels.fetch(interaction.channel_id);
      migrating.splice(migrating.indexOf(guild.id));
      await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({
        data: {
          content: `Moved from **${oldChannel.name}** to **${voiceChannel.name}**`
        }
      });
      updateQueue(guild.id, serverQueue, null);
      const { play } = require("./play.js");
      if (!serverQueue.random) play(guild, serverQueue.songs[0], 0, seek);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(guild.id, serverQueue, serverQueue.pool);
        play(guild, pending);
      }
    }, 3000);
    return InteractionResponse.sendMessage("Migrating in 3 seconds...");
  },
  async music(message, serverQueue) {
    const exit = NorthClient.storage.guilds[message.guild.id].exit;
    const migrating = NorthClient.storage.migrating;
    if (migrating.find(x => x === message.guild.id)) return message.channel.send("I'm on my way!").then(msg => msg.delete(10000));
    if (!message.member.voice.channel) return message.channel.send("You are not in any voice channel!");
    if (!message.guild.me.voice.channel) return message.channel.send("I am not in any voice channel!");
    if (message.member.voice.channelID === message.guild.me.voice.channelID) return message.channel.send("I'm already in the same channel with you!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    if (!serverQueue.playing) return message.channel.send("I'm not playing anything.");
    if (!message.member.voice.channel.permissionsFor(message.guild.me).has(3145728)) return message.channel.send("I don't have the required permissions to play music here!");
    migrating.push(message.guild.id);
    if (exit) NorthClient.storage.guilds[guild.id].exit = false;
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
      migrating.splice(migrating.indexOf(message.guild.id));
      await msg.edit(`Moved from **${oldChannel.name}** to **${voiceChannel.name}**`).catch(() => {});
      updateQueue(message.guild.id, serverQueue, null);
      const { play } = require("./play.js");
      if (!serverQueue.random) play(message.guild, serverQueue.songs[0], 0, seek);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(message.guild.id, serverQueue, serverQueue.pool);
        play(message.guild, pending);
      }
    }, 3000);
  }
}