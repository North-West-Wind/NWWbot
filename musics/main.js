const Discord = require("discord.js");
const queue = new Discord.Collection();
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
  name: "main",
  async music(message, commandName) {
    if (!message.guild) return await message.channel.send("You can only use music commands in server!");
    const command = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    const serverQueue = queue.get(message.guild.id);
    try {
      await command.music(message, serverQueue);
    } catch (error) {
      NorthClient.storage.error(error);
      await message.reply("there was an error trying to execute that command!");
    }
  },
  getQueues() { return queue; },
  async updateQueue(message, serverQueue, pool) {
    if (!serverQueue) queue.delete(message.guild.id);
    else queue.set(message.guild.id, serverQueue);
    if (!pool) return;
    try {
      await pool.query(`UPDATE servers SET looping = ${serverQueue && serverQueue.looping ? 1 : "NULL"}, repeating = ${serverQueue && serverQueue.repeating ? 1 : "NULL"}, random = ${serverQueue && serverQueue.random ? 1 : "NULL"}, queue = ${!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs) || serverQueue.songs.length < 1 ? "NULL" : `'${escape(JSON.stringify(serverQueue.songs))}'`} WHERE id = '${message.guild.id}'`);
    } catch(err) {
      NorthClient.storage.error(err);
      if (!message.dummy) message.reply("there was an error trying to update the queue!");
    }
  },
  stop(guild) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;
    if (serverQueue.connection && serverQueue.connection.dispatcher)
      serverQueue.connection.dispatcher.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    if (guild.me.voice.channel)
      guild.me.voice.channel.leave();
  },
  setQueue(guild, songs, loopStatus, repeatStatus, pool) {
    const queueContruct = {
      textChannel: null,
      voiceChannel: null,
      connection: null,
      songs: songs,
      volume: 1,
      playing: false,
      paused: false,
      looping: loopStatus,
      repeating: repeatStatus,
      random: false,
      pool: pool
    };
    queue.set(guild, queueContruct);
    return queueContruct;
  },
  checkQueue() {
    return queue.size > 0;
  }
}