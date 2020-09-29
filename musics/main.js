var looping = new Map();
var queue = new Map();
var repeat = new Map();
var migrating = [];

module.exports = {
  name: "main",
  music(message, commandName, pool, exit) {
    const command =
    console.commands.get(commandName) ||
    console.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );
    
    const serverQueue = queue.get(message.guild.id);
    
    try {
      command.music(message, serverQueue, looping, queue, pool, repeat, exit, migrating);
    } catch(error) {
      console.error(error);
      message.reply("there was an error trying to execute that command!");
    }
  },
  stop(guild) {
    const serverQueue = queue.get(guild.id);
    if(!serverQueue) return;
    if(serverQueue.connection && serverQueue.connection.dispatcher)
  serverQueue.connection.dispatcher.destroy();
  serverQueue.playing = false;
  serverQueue.connection = null;
  serverQueue.voiceChannel = null;
  serverQueue.textChannel = null;
  if(guild.me.voice.channel)
  guild.me.voice.channel.leave();
  },
  setQueue(guild, songs, loopStatus, repeatStatus) {
    const queueContruct = {
          textChannel: null,
          voiceChannel: null,
          connection: null,
          songs: songs,
          volume: 1,
          playing: false,
          paused: false,
          startTime: 0
        };
    repeat.set(guild, repeatStatus);
    looping.set(guild, loopStatus);
    queue.set(guild, queueContruct);
  },
  checkQueue() {
    return queue.size > 0;
  }
}