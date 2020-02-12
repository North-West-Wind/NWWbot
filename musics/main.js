var looping = new Map()
var queue = new Map();

module.exports = {
  name: "main",
  music(message, commandName) {
    const command =
    message.client.commands.get(commandName) ||
    message.client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );
    
    const serverQueue = queue.get(message.guild.id);
    
    try {
      command.music(message, serverQueue, looping, queue);
    } catch(error) {
      console.error(error);
        message.reply("there was an error trying to execute that command!");
    }
  },
  stop(guild) {
    const serverQueue = queue.get(guild.id);
    serverQueue.songs = [];
  serverQueue.connection.dispatcher.destroy();
  guild.me.voice.channel.leave();
  queue.delete(guild.id)
  }
}